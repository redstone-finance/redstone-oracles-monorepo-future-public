import { ISafeNumber, SafeZero, createSafeNumber } from "../ISafeNumber";

/**
 * The spline calculated during interpolation.
 */
export class CubicInterpolation {
  constructor(
    private firstX: ISafeNumber,
    private lastX: ISafeNumber,
    private firstY: ISafeNumber,
    private lastY: ISafeNumber,
    private firstSlope: ISafeNumber,
    private lastSlope: ISafeNumber,
    private fun: (x: ISafeNumber) => ISafeNumber
  ) {}

  /**
   * Returns the value of the function.
   */
  public forX(x: ISafeNumber): ISafeNumber {
    // queries outside the range of points are matched by linear interpolation
    if (x.lt(this.firstX)) {
      return this.firstY.sub(this.firstSlope.mul(this.firstX.sub(x)));
    } else if (x.gt(this.lastX)) {
      return this.lastY.add(this.lastSlope.mul(x.sub(this.lastX)));
    } else {
      // we use the calculated cubic interpolation
      return this.fun(x);
    }
  }

  /**
   * Returns the approximate function argument for a given value.
   */
  public forY(y: ISafeNumber, precision: ISafeNumber): ISafeNumber {
    // queries outside the range of points are matched by linear interpolation
    if (y.lt(this.firstY)) {
      return this.firstX.sub(this.firstY.sub(y).div(this.firstSlope));
    } else if (y.gt(this.lastY)) {
      return this.lastX.add(y.sub(this.lastY).div(this.lastSlope));
    } else {
      // binary search for X for which Y is within the given precision
      let lowX = this.firstX;
      let highX = this.lastX;
      let tries = 50;
      while (lowX.lte(highX) && tries > 0) {
        const midX = lowX.add(highX).div(2);
        if (highX.sub(lowX).abs().lt(precision)) {
          return midX;
        }

        const midY = this.forX(midX);
        if (midY.sub(y).abs().lt(precision)) {
          return midX;
        }

        if (midY.lt(y)) {
          lowX = midX;
        } else {
          highX = midX;
        }
        tries--;
      }
      throw new Error(`X was not found for Y = ${y.toString()}`);
    }
  }
}

/**
 * Interpolation of functions based on selected strictly monotonic points.
 * Interpolation returns a monotonic spline where each piece is a third-degree polynomial specified in Hermite form.
 *
 * Method based on https://en.wikipedia.org/wiki/Monotone_cubic_interpolation.
 * Method source code inspired by code in https://en.wikipedia.org/wiki/Monotone_cubic_interpolation#Example_implementation.
 */
export const monotoneCubicInterpolation = (
  xs: ISafeNumber[],
  ys: ISafeNumber[]
): CubicInterpolation => {
  const { fun, firstSlope, lastSlope } = createInterpolant(xs, ys);
  return new CubicInterpolation(
    xs[0],
    xs[xs.length - 1],
    ys[0],
    ys[ys.length - 1],
    firstSlope,
    lastSlope,
    fun
  );
};

const createInterpolant = (
  xs: ISafeNumber[],
  ys: ISafeNumber[]
): {
  fun: (x: ISafeNumber) => ISafeNumber;
  firstSlope: ISafeNumber;
  lastSlope: ISafeNumber;
} => {
  // checking the initial conditions
  if (xs.length != ys.length) {
    throw new Error("The number of xs and ys should be equal");
  }
  if (xs.length === 0) {
    throw new Error("Empty array of xs");
  }
  if (xs.length === 1) {
    throw new Error("interpolation cannot be performed for a single point");
  }

  // sorting points
  const [sortedXs, sortedYs] = sortPoints(xs, ys);

  // monotonicity check
  if (!isStrictlyMonotonic(sortedYs)) {
    throw new Error("The given points are not monotonic");
  }

  // consecutive differences and slopes
  const dys = [],
    dxs = [],
    ms = [];
  for (let i = 0; i < sortedXs.length - 1; i++) {
    const dx = sortedXs[i + 1].sub(sortedXs[i]);
    const dy = sortedYs[i + 1].sub(sortedYs[i]);
    dxs[i] = dx;
    dys[i] = dy;
    ms[i] = dy.div(dx);
  }

  // degree-1 coefficients
  const c1s = [ms[0]];
  for (let i = 0; i < dxs.length - 1; i++) {
    const m = ms[i],
      mNext = ms[i + 1];
    if (m.mul(mNext).lte(SafeZero)) {
      c1s.push(SafeZero);
    } else {
      const dx_ = dxs[i],
        dxNext = dxs[i + 1],
        common = dx_.add(dxNext);
      c1s.push(
        common
          .mul(3)
          .div(common.add(dxNext).div(m).add(common.add(dx_).div(mNext)))
      );
    }
  }
  c1s.push(ms[ms.length - 1]);

  // degree-2 and degree-3 coefficients
  const c2s: ISafeNumber[] = [],
    c3s: ISafeNumber[] = [];
  for (let i = 0; i < c1s.length - 1; i++) {
    const c1 = c1s[i],
      m = ms[i],
      invDx = createSafeNumber(1).div(dxs[i]),
      common = c1
        .add(c1s[i + 1])
        .sub(m)
        .sub(m);
    c2s.push(m.sub(c1).sub(common).mul(invDx));
    c3s.push(common.mul(invDx).mul(invDx));
  }

  return {
    fun: createInterpolantFunction(sortedXs, sortedYs, c1s, c2s, c3s),
    firstSlope: ms[0],
    lastSlope: ms[ms.length - 1],
  };
};

const sortPoints = (
  xs: ISafeNumber[],
  ys: ISafeNumber[]
): [ISafeNumber[], ISafeNumber[]] => {
  const indexes = [...Array(xs.length).keys()];
  indexes.sort((a, b) => {
    return xs[a].lt(xs[b]) ? -1 : 1;
  });

  const sortedXs = [];
  const sortedYs = [];
  for (let i = 0; i < xs.length; i++) {
    sortedXs[i] = xs[indexes[i]];
    sortedYs[i] = ys[indexes[i]];
  }
  return [sortedXs, sortedYs];
};

/**
 * Whether the given list of values is strictly monotonic.
 */
const isStrictlyMonotonic = (ys: ISafeNumber[]) => {
  if (ys.length < 2) {
    return true;
  }

  // direction of monotonicity
  let direction: "increasing" | "decreasing" | "undefined" = "undefined";

  let previous = ys[0];
  for (let i = 1; i < ys.length; i++) {
    const current = ys[i];

    // check monotonicity
    if (current.gt(previous)) {
      if (direction === "decreasing") {
        return false;
      }
      direction = "increasing";
    } else if (current.lt(previous)) {
      if (direction === "increasing") {
        return false;
      }
      direction = "decreasing";
    } else {
      // equality, no strict monotonicity
      return false;
    }

    previous = current;
  }

  return true;
};

const createInterpolantFunction =
  (
    xs: ISafeNumber[],
    ys: ISafeNumber[],
    c1s: ISafeNumber[],
    c2s: ISafeNumber[],
    c3s: ISafeNumber[]
  ) =>
  (x: ISafeNumber): ISafeNumber => {
    // checking whether the argument is from the appropriate range
    if (x.lt(xs[0]) || x.gt(xs[xs.length - 1])) {
      throw new Error(
        `The function only handles arguments in the range [${xs[0].toString()},${xs[
          xs.length - 1
        ].toString()}]`
      );
    }

    // the rightmost point in the dataset should give an exact result
    if (x.eq(xs[xs.length - 1])) {
      return ys[xs.length - 1];
    }

    // search for the interval x is in, returning the corresponding y if x is one of the original xs
    let low = 0,
      high = c3s.length - 1;
    while (low <= high) {
      const middle = Math.floor(0.5 * (low + high));
      const middleX = xs[middle];
      if (middleX.lt(x)) {
        low = middle + 1;
      } else if (middleX.gt(x)) {
        high = middle - 1;
      } else {
        return ys[middle];
      }
    }
    const i = Math.max(0, high);

    // interpolate
    const diff = x.sub(xs[i]),
      diffSq = diff.mul(diff);
    return ys[i]
      .add(c1s[i].mul(diff))
      .add(c2s[i].mul(diffSq))
      .add(c3s[i].mul(diff).mul(diffSq));
  };
