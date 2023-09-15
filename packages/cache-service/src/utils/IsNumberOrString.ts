import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "string-or-number", async: false })
export class IsNumberOrString implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  validate(text: unknown, _args: ValidationArguments) {
    return typeof text === "number" || typeof text === "string";
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  defaultMessage(_args: ValidationArguments) {
    return "($value) must be number or string";
  }
}
