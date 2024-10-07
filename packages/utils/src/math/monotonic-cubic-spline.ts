/**
 * The spline calculated during interpolation.
 */
export class CubicInterpolation {
  constructor(
    private xs: number[],
    private ys: number[],
    private firstSlope: number,
    private lastSlope: number,
    private fun: (x: number) => number
  ) {}

  /**
   * Returns the value of the function.
   */
  public forX(x: number): number {
    // queries outside the range of points are matched by linear interpolation
    if (x < this.xs[0]) {
      return this.ys[0] - this.firstSlope * (this.xs[0] - x);
    } else if (x > this.xs[this.xs.length - 1]) {
      return (
        this.ys[this.ys.length - 1] +
        this.lastSlope * (x - this.xs[this.xs.length - 1])
      );
    } else {
      // we use the calculated cubic interpolation
      return this.fun(x);
    }
  }

  /**
   * Returns the approximate function argument for a given value.
   */
  public forY(y: number, precision: number): number {
    // queries outside the range of points are matched by linear interpolation
    if (y < this.ys[0]) {
      return this.xs[0] - (this.ys[0] - y) / this.firstSlope;
    } else if (y > this.ys[this.ys.length - 1]) {
      return (
        this.xs[this.xs.length - 1] +
        (y - this.ys[this.ys.length - 1]) / this.lastSlope
      );
    } else {
      // search for the interval y is in, returning the corresponding x if y is one of the original ys
      const i = findIntervalIndex(y, this.ys);
      if (y === this.ys[i]) {
        return this.xs[i];
      }

      // binary search for X for which Y is within the given precision
      let lowX = this.xs[i];
      let highX = this.xs[i + 1];
      let tries = 50;
      while (lowX <= highX && tries > 0) {
        const midX = (lowX + highX) / 2;
        if (Math.abs(highX - lowX) < precision) {
          return midX;
        }

        const midY = this.forX(midX);
        if (Math.abs(midY - y) < precision) {
          return midX;
        }

        if (midY < y) {
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
  xs: number[],
  ys: number[]
): CubicInterpolation => {
  const { fun, firstSlope, lastSlope, sortedXs, sortedYs } = createInterpolant(
    xs,
    ys
  );
  return new CubicInterpolation(sortedXs, sortedYs, firstSlope, lastSlope, fun);
};

const createInterpolant = (
  xs: number[],
  ys: number[]
): {
  fun: (x: number) => number;
  firstSlope: number;
  lastSlope: number;
  sortedXs: number[];
  sortedYs: number[];
} => {
  // checking the initial conditions
  if (xs.length != ys.length) {
    throw new Error("The number of xs and ys should be equal");
  }
  if (xs.length === 0) {
    throw new Error("Empty array of xs");
  }
  if (xs.length === 1) {
    throw new Error("Interpolation cannot be performed for a single point");
  }

  // sorting points
  const [sortedXs, sortedYs] = sortPoints(xs, ys);

  // monotonicity check
  if (!isMonotonic(sortedYs)) {
    throw new Error("The given points are not monotonic");
  }

  // consecutive differences and slopes
  const dys = [],
    dxs = [],
    ms = [];
  for (let i = 0; i < sortedXs.length - 1; i++) {
    const dx = sortedXs[i + 1] - sortedXs[i];
    const dy = sortedYs[i + 1] - sortedYs[i];
    dxs[i] = dx;
    dys[i] = dy;
    ms[i] = dy / dx;
  }

  // degree-1 coefficients
  const c1s = [ms[0]];
  for (let i = 0; i < dxs.length - 1; i++) {
    const m = ms[i],
      mNext = ms[i + 1];
    if (m * mNext <= 0) {
      c1s.push(0);
    } else {
      const dx = dxs[i],
        dxNext = dxs[i + 1],
        common = dx + dxNext;
      c1s.push((3 * common) / ((common + dxNext) / m + (common + dx) / mNext));
    }
  }
  c1s.push(ms[ms.length - 1]);

  // degree-2 and degree-3 coefficients
  const c2s = [],
    c3s = [];
  for (let i = 0; i < c1s.length - 1; i++) {
    const c1 = c1s[i],
      m = ms[i],
      invDx = 1 / dxs[i],
      common = c1 + c1s[i + 1] - 2 * m;
    c2s.push((m - c1 - common) * invDx);
    c3s.push(common * invDx * invDx);
  }

  return {
    fun: createInterpolantFunction(sortedXs, sortedYs, c1s, c2s, c3s),
    firstSlope: ms[0],
    lastSlope: ms[ms.length - 1],
    sortedXs,
    sortedYs,
  };
};

const sortPoints = (xs: number[], ys: number[]): [number[], number[]] => {
  const indexes = [...Array(xs.length).keys()];
  indexes.sort((a, b) => {
    return xs[a] - xs[b];
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
 * Whether the given list of values is monotonic.
 */
const isMonotonic = (ys: number[]) => {
  if (ys.length < 2) {
    return true;
  }

  // direction of monotonicity
  let direction: "increasing" | "decreasing" | "undefined" = "undefined";

  let previous = ys[0];
  for (let i = 1; i < ys.length; i++) {
    const current = ys[i];

    // check monotonicity
    if (current > previous) {
      if (direction === "decreasing") {
        return false;
      }
      direction = "increasing";
    } else if (current < previous) {
      if (direction === "increasing") {
        return false;
      }
      direction = "decreasing";
    }

    previous = current;
  }

  return true;
};

const createInterpolantFunction =
  (xs: number[], ys: number[], c1s: number[], c2s: number[], c3s: number[]) =>
  (x: number): number => {
    // checking whether the argument is from the appropriate range
    if (x < xs[0] || x > xs[xs.length - 1]) {
      throw new Error(
        `The function only handles arguments in the range [${xs[0].toString()},${xs[
          xs.length - 1
        ].toString()}]`
      );
    }

    // search for the interval x is in, returning the corresponding y if x is one of the original xs
    const i = findIntervalIndex(x, xs);
    if (x === xs[i]) {
      return ys[i];
    }

    // interpolate
    const diff = x - xs[i];
    return ys[i] + diff * (c1s[i] + diff * (c2s[i] + diff * c3s[i]));
  };

const findIntervalIndex = (point: number, points: number[]) => {
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i] <= point && point < points[i + 1]) {
      return i;
    }
  }
  if (point === points[points.length - 1]) {
    return points.length - 1;
  }
  throw new Error(
    `The point (${point}) is outside the point list [${points.join(",")}]`
  );
};
