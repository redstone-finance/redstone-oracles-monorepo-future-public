// Taken from https://github.com/radixdlt/typescript-radix-engine-toolkit/blob/852a6adeee55f7d74d759da935e1faa2cb3bc8a2/src/generated/converter.ts

import {
  Convert,
  DecryptorsByCurve,
  EncryptedMessage,
  EntityType,
  Expression,
  Instruction,
  Instructions,
  Intent,
  ManifestAddress,
  ManifestSborStringRepresentation,
  Message,
  MessageContent,
  MessageValidationConfig,
  NotarizedTransaction,
  OlympiaNetwork,
  PlainTextMessage,
  PublicKey,
  SerializationMode,
  Signature,
  SignatureWithPublicKey,
  SignedIntent,
  TransactionHash,
  TransactionHeader,
  TransactionManifest,
  ValidationConfig,
  Value,
  ValueKind,
} from "@radixdlt/radix-engine-toolkit";
import {
  SerializableDecryptorsByCurve,
  SerializableEncryptedMessage,
  SerializableEntityType,
  SerializableExpression,
  SerializableInstruction,
  SerializableInstructions,
  SerializableIntent,
  SerializableManifestAddress,
  SerializableManifestSborStringRepresentation,
  SerializableManifestValue,
  SerializableManifestValueKind,
  SerializableMessage,
  SerializableMessageContent,
  SerializableMessageValidationConfig,
  SerializableNotarizedTransaction,
  SerializableOlympiaNetwork,
  SerializablePlainTextMessage,
  SerializablePublicKey,
  SerializableSerializationMode,
  SerializableSignature,
  SerializableSignatureWithPublicKey,
  SerializableSignedIntent,
  SerializableTransactionHash,
  SerializableTransactionHeader,
  SerializableTransactionManifest,
  SerializableValidationConfig,
} from "./generated";

/**
 * A class that provides functionality for converting the generated models to their hand-written
 * counterparts.
 */
export class GeneratedConverter {
  static PublicKey = class {
    static toGenerated(value: PublicKey): SerializablePublicKey {
      return {
        kind: value.curve,
        value: Convert.Uint8Array.toHexString(value.publicKey),
      };
    }

    static fromGenerated(value: SerializablePublicKey): PublicKey {
      switch (value.kind) {
        case "Secp256k1":
          return new PublicKey.Secp256k1(
            Convert.HexString.toUint8Array(value.value)
          );
        case "Ed25519":
          return new PublicKey.Ed25519(
            Convert.HexString.toUint8Array(value.value)
          );
      }
    }
  };

  static Signature = class {
    static toGenerated(value: Signature): SerializableSignature {
      return {
        kind: value.curve,
        value: Convert.Uint8Array.toHexString(value.signature),
      };
    }

    static fromGenerated(value: SerializableSignature): Signature {
      switch (value.kind) {
        case "Secp256k1":
          return new Signature.Secp256k1(
            Convert.HexString.toUint8Array(value.value)
          );
        case "Ed25519":
          return new Signature.Ed25519(
            Convert.HexString.toUint8Array(value.value)
          );
      }
    }
  };

  static SignatureWithPublicKey = class {
    static toGenerated(
      value: SignatureWithPublicKey
    ): SerializableSignatureWithPublicKey {
      switch (value.curve) {
        case "Ed25519":
          return {
            kind: "Ed25519",
            value: {
              public_key: Convert.Uint8Array.toHexString(value.publicKey!),
              signature: Convert.Uint8Array.toHexString(value.signature),
            },
          };
        case "Secp256k1":
          return {
            kind: "Secp256k1",
            value: {
              signature: Convert.Uint8Array.toHexString(value.signature),
            },
          };
      }
    }

    static fromGenerated(
      value: SerializableSignatureWithPublicKey
    ): SignatureWithPublicKey {
      switch (value.kind) {
        case "Secp256k1":
          return new SignatureWithPublicKey.Secp256k1(
            Convert.HexString.toUint8Array(value.value.signature)
          );
        case "Ed25519":
          return new SignatureWithPublicKey.Ed25519(
            Convert.HexString.toUint8Array(value.value.signature),
            Convert.HexString.toUint8Array(value.value.public_key)
          );
      }
    }
  };

  static OlympiaNetwork = class {
    static toGenerated(value: OlympiaNetwork): SerializableOlympiaNetwork {
      return SerializableOlympiaNetwork[OlympiaNetwork[value]];
    }

    static fromGenerated(value: SerializableOlympiaNetwork): OlympiaNetwork {
      return OlympiaNetwork[SerializableOlympiaNetwork[value]];
    }
  };

  static SerializationMode = class {
    static toGenerated(
      value: SerializationMode
    ): SerializableSerializationMode {
      return SerializableSerializationMode[SerializationMode[value]];
    }

    static fromGenerated(
      value: SerializableSerializationMode
    ): SerializationMode {
      return SerializationMode[SerializableSerializationMode[value]];
    }
  };

  static ManifestSborStringRepresentation = class {
    static toGenerated(
      value: ManifestSborStringRepresentation
    ): SerializableManifestSborStringRepresentation {
      switch (value) {
        case ManifestSborStringRepresentation.ManifestString:
          return {
            kind: "ManifestString",
          };
        case ManifestSborStringRepresentation.ProgrammaticJson:
          return {
            kind: "Json",
            value: SerializableSerializationMode.Programmatic,
          };
        case ManifestSborStringRepresentation.NaturalJson:
          return {
            kind: "Json",
            value: SerializableSerializationMode.Natural,
          };
        case ManifestSborStringRepresentation.ModelJson:
          return {
            kind: "Json",
            value: SerializableSerializationMode.Model,
          };
      }
    }

    static fromGenerated(
      value: SerializableManifestSborStringRepresentation
    ): ManifestSborStringRepresentation {
      switch (value.kind) {
        case "ManifestString":
          return ManifestSborStringRepresentation.ManifestString;
        case "Json":
          switch (value.value) {
            case SerializableSerializationMode.Programmatic:
              return ManifestSborStringRepresentation.ProgrammaticJson;
            case SerializableSerializationMode.Natural:
              return ManifestSborStringRepresentation.NaturalJson;
            case SerializableSerializationMode.Model:
              return ManifestSborStringRepresentation.ModelJson;
          }
      }
    }
  };

  static ManifestValueKind = class {
    static toGenerated(value: ValueKind): SerializableManifestValueKind {
      return SerializableManifestValueKind[ValueKind[value]];
    }

    static fromGenerated(value: SerializableManifestValueKind): ValueKind {
      return ValueKind[SerializableManifestValueKind[value]];
    }
  };

  static Expression = class {
    static toGenerated(value: Expression): SerializableExpression {
      return SerializableExpression[Expression[value]];
    }

    static fromGenerated(value: SerializableExpression): Expression {
      return Expression[SerializableExpression[value]];
    }
  };

  static ManifestAddress = class {
    static toGenerated(value: ManifestAddress): SerializableManifestAddress {
      switch (value.kind) {
        case "Named":
          return {
            kind: value.kind,
            value: Convert.Number.toString(value.value),
          };
        case "Static":
          return {
            kind: value.kind,
            value: value.value,
          };
      }
    }

    static fromGenerated(value: SerializableManifestAddress): ManifestAddress {
      switch (value.kind) {
        case "Named":
          return {
            kind: value.kind,
            value: Convert.String.toNumber(value.value),
          };
        case "Static":
          return {
            kind: value.kind,
            value: value.value,
          };
      }
    }
  };

  static ManifestValue = class {
    static toGenerated(value: Value): SerializableManifestValue {
      switch (value.kind) {
        case ValueKind.Bool:
          return {
            kind: value.kind,
            value: {
              value: value.value,
            },
          };
        /* Numeric Types converted to strings */
        case ValueKind.I8:
        case ValueKind.I16:
        case ValueKind.I32:
        case ValueKind.U8:
        case ValueKind.U16:
        case ValueKind.U32:
        case ValueKind.Bucket:
        case ValueKind.Proof:
        case ValueKind.AddressReservation:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: Convert.Number.toString(value.value),
            },
          };
        /* BigInt types converted to strings */
        case ValueKind.I64:
        case ValueKind.I128:
        case ValueKind.U64:
        case ValueKind.U128:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: Convert.BigInt.toString(value.value),
            },
          };
        /* String values */
        case ValueKind.Blob:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: Convert.Uint8Array.toHexString(value.value),
            },
          };
        case ValueKind.String:
        case ValueKind.NonFungibleLocalId:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: value.value,
            },
          };
        /* Decimal conversions */
        case ValueKind.Decimal:
        case ValueKind.PreciseDecimal:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: Convert.Decimal.toString(value.value),
            },
          };
        /* Sum and Product Types */
        case ValueKind.Enum:
          return {
            kind: value.kind,
            value: {
              discriminator: Convert.Number.toString(value.discriminator),
              fields: value.fields.map(
                GeneratedConverter.ManifestValue.toGenerated
              ),
            },
          };
        case ValueKind.Array:
          return {
            kind: value.kind,
            value: {
              element_value_kind:
                SerializableManifestValueKind[value.elementValueKind],
              elements: value.elements.map(
                GeneratedConverter.ManifestValue.toGenerated
              ),
            },
          };
        case ValueKind.Tuple:
          return {
            kind: value.kind,
            value: {
              fields: value.fields.map(
                GeneratedConverter.ManifestValue.toGenerated
              ),
            },
          };
        case ValueKind.Map:
          return {
            kind: value.kind,
            value: {
              key_value_kind: SerializableManifestValueKind[value.keyValueKind],
              value_value_kind:
                SerializableManifestValueKind[value.valueValueKind],
              entries: value.entries.map((mapEntry) => {
                return {
                  key: GeneratedConverter.ManifestValue.toGenerated(
                    mapEntry.key
                  ),
                  value: GeneratedConverter.ManifestValue.toGenerated(
                    mapEntry.value
                  ),
                };
              }),
            },
          };
        /* Misc */
        case ValueKind.Address:
          return {
            kind: value.kind,
            value: {
              value: GeneratedConverter.ManifestAddress.toGenerated(
                value.value
              ),
            },
          };
        case ValueKind.Expression:
          return {
            kind: value.kind,
            value: {
              value: GeneratedConverter.Expression.toGenerated(value.value),
            },
          };
      }
    }

    static fromGenerated(value: SerializableManifestValue): Value {
      switch (value.kind) {
        case "Bool":
          return {
            kind: ValueKind.Bool,
            value: value.value.value,
          };
        case "I8":
        case "I16":
        case "I32":
        case "U8":
        case "U16":
        case "U32":
        case "Bucket":
        case "Proof":
        case "AddressReservation":
          return {
            kind: ValueKind[value.kind],
            value: Convert.String.toNumber(value.value.value),
          };
        case "I64":
        case "I128":
        case "U64":
        case "U128":
          return {
            kind: ValueKind[value.kind],
            value: Convert.String.toBigInt(value.value.value),
          };
        case "Blob":
          return {
            kind: ValueKind[value.kind],
            value: Convert.HexString.toUint8Array(value.value.value),
          };
        case "String":
        case "NonFungibleLocalId":
          return {
            kind: ValueKind[value.kind],
            value: value.value.value,
          };
        case "Decimal":
        case "PreciseDecimal":
          return {
            kind: ValueKind[value.kind],
            value: Convert.String.toDecimal(value.value.value),
          };
        case "Enum":
          return {
            kind: ValueKind.Enum,
            discriminator: Convert.String.toNumber(value.value.discriminator),
            fields: value.value.fields.map(
              GeneratedConverter.ManifestValue.fromGenerated
            ),
          };
        case "Array":
          return {
            kind: ValueKind.Array,
            elementValueKind: ValueKind[value.value.element_value_kind],
            elements: value.value.elements.map(
              GeneratedConverter.ManifestValue.fromGenerated
            ),
          };
        case "Tuple":
          return {
            kind: ValueKind.Tuple,
            fields: value.value.fields.map(
              GeneratedConverter.ManifestValue.fromGenerated
            ),
          };
        case "Map":
          return {
            kind: ValueKind.Map,
            keyValueKind: ValueKind[value.value.key_value_kind],
            valueValueKind: ValueKind[value.value.value_value_kind],
            entries: value.value.entries.map((entry) => {
              return {
                key: GeneratedConverter.ManifestValue.fromGenerated(entry.key),
                value: GeneratedConverter.ManifestValue.fromGenerated(
                  entry.value
                ),
              };
            }),
          };
        case "Address":
          return {
            kind: ValueKind.Address,
            value: GeneratedConverter.ManifestAddress.fromGenerated(
              value.value.value
            ),
          };
        case "Expression":
          return {
            kind: ValueKind.Expression,
            value: GeneratedConverter.Expression.fromGenerated(
              value.value.value
            ),
          };
      }
    }
  };

  static Instruction = class {
    static toGenerated(value: Instruction): SerializableInstruction {
      switch (value.kind) {
        case "TakeAllFromWorktop":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
            },
          };
        case "TakeFromWorktop":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "TakeNonFungiblesFromWorktop":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              ids: value.ids,
            },
          };
        case "ReturnToWorktop":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
            },
          };
        case "AssertWorktopContainsAny":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
            },
          };
        case "AssertWorktopContains":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "AssertWorktopContainsNonFungibles":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              ids: value.ids,
            },
          };
        case "PopFromAuthZone":
          return {
            kind: value.kind,
          };
        case "PushToAuthZone":
          return {
            kind: value.kind,
            value: {
              proof_id: Convert.Number.toString(value.proofId),
            },
          };
        case "DropNamedProofs":
        case "DropAuthZoneProofs":
        case "DropAuthZoneRegularProofs":
        case "DropAuthZoneSignatureProofs":
          return {
            kind: value.kind,
          };
        case "CreateProofFromAuthZoneOfAmount":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "CreateProofFromAuthZoneOfNonFungibles":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              ids: value.ids,
            },
          };
        case "CreateProofFromAuthZoneOfAll":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
            },
          };

        case "CreateProofFromBucketOfAmount":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "CreateProofFromBucketOfNonFungibles":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
              ids: value.ids,
            },
          };
        case "CreateProofFromBucketOfAll":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
            },
          };
        case "BurnResource":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
            },
          };
        case "CloneProof":
          return {
            kind: value.kind,
            value: {
              proof_id: Convert.Number.toString(value.proofId),
            },
          };
        case "DropProof":
          return {
            kind: value.kind,
            value: {
              proof_id: Convert.Number.toString(value.proofId),
            },
          };
        case "CallFunction":
          return {
            kind: value.kind,
            value: {
              package_address: GeneratedConverter.ManifestAddress.toGenerated(
                value.packageAddress
              ),
              blueprint_name: value.blueprintName,
              function_name: value.functionName,
              args: GeneratedConverter.ManifestValue.toGenerated(value.args),
            },
          };
        case "CallMethod":
        case "CallRoyaltyMethod":
        case "CallMetadataMethod":
        case "CallRoleAssignmentMethod":
          return {
            kind: value.kind,
            value: {
              address: GeneratedConverter.ManifestAddress.toGenerated(
                value.address
              ),
              method_name: value.methodName,
              args: GeneratedConverter.ManifestValue.toGenerated(value.args),
            },
          };
        case "CallDirectVaultMethod":
          return {
            kind: value.kind,
            value: {
              address: value.address,
              method_name: value.methodName,
              args: GeneratedConverter.ManifestValue.toGenerated(value.args),
            },
          };
        case "DropAllProofs":
          return {
            kind: value.kind,
          };
        case "AllocateGlobalAddress":
          return {
            kind: value.kind,
            value: {
              package_address: value.packageAddress,
              blueprint_name: value.blueprintName,
            },
          };
      }
    }

    static fromGenerated(value: SerializableInstruction): Instruction {
      switch (value.kind) {
        case "TakeAllFromWorktop":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
          };
        case "TakeFromWorktop":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "TakeNonFungiblesFromWorktop":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            ids: value.value.ids,
          };
        case "ReturnToWorktop":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
          };
        case "AssertWorktopContainsAny":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
          };
        case "AssertWorktopContains":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "AssertWorktopContainsNonFungibles":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            ids: value.value.ids,
          };
        case "PopFromAuthZone":
          return {
            kind: value.kind,
          };
        case "PushToAuthZone":
          return {
            kind: value.kind,
            proofId: Convert.String.toNumber(value.value.proof_id),
          };
        case "DropNamedProofs":
        case "DropAuthZoneProofs":
        case "DropAuthZoneRegularProofs":
        case "DropAuthZoneSignatureProofs":
          return {
            kind: value.kind,
          };
        case "CreateProofFromAuthZoneOfAmount":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "CreateProofFromAuthZoneOfNonFungibles":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            ids: value.value.ids,
          };
        case "CreateProofFromAuthZoneOfAll":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
          };
        case "CreateProofFromBucketOfAmount":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "CreateProofFromBucketOfNonFungibles":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
            ids: value.value.ids,
          };
        case "CreateProofFromBucketOfAll":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
          };
        case "BurnResource":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
          };
        case "CloneProof":
          return {
            kind: value.kind,
            proofId: Convert.String.toNumber(value.value.proof_id),
          };
        case "DropProof":
          return {
            kind: value.kind,
            proofId: Convert.String.toNumber(value.value.proof_id),
          };
        case "CallFunction":
          return {
            kind: value.kind,
            packageAddress: GeneratedConverter.ManifestAddress.fromGenerated(
              value.value.package_address
            ),
            blueprintName: value.value.blueprint_name,
            functionName: value.value.function_name,
            args: GeneratedConverter.ManifestValue.fromGenerated(
              value.value.args
            ),
          };
        case "CallMethod":
        case "CallRoyaltyMethod":
        case "CallMetadataMethod":
        case "CallRoleAssignmentMethod":
          return {
            kind: value.kind,
            address: GeneratedConverter.ManifestAddress.fromGenerated(
              value.value.address
            ),
            methodName: value.value.method_name,
            args: GeneratedConverter.ManifestValue.fromGenerated(
              value.value.args
            ),
          };
        case "CallDirectVaultMethod":
          return {
            kind: value.kind,
            address: value.value.address,
            methodName: value.value.method_name,
            args: GeneratedConverter.ManifestValue.fromGenerated(
              value.value.args
            ),
          };
        case "DropAllProofs":
          return {
            kind: value.kind,
          };
        case "AllocateGlobalAddress":
          return {
            kind: value.kind,
            packageAddress: value.value.package_address,
            blueprintName: value.value.blueprint_name,
          };
      }
    }
  };

  static Instructions = class {
    static toGenerated(value: Instructions): SerializableInstructions {
      switch (value.kind) {
        case "String":
          return value;
        case "Parsed":
          return {
            kind: "Parsed",
            value: value.value.map(GeneratedConverter.Instruction.toGenerated),
          };
      }
    }

    static fromGenerated(value: SerializableInstructions): Instructions {
      switch (value.kind) {
        case "String":
          return value;
        case "Parsed":
          return {
            kind: "Parsed",
            value: value.value.map(
              GeneratedConverter.Instruction.fromGenerated
            ),
          };
      }
    }
  };

  static TransactionManifest = class {
    static toGenerated(
      value: TransactionManifest
    ): SerializableTransactionManifest {
      return {
        instructions: GeneratedConverter.Instructions.toGenerated(
          value.instructions
        ),
        blobs: value.blobs.map(Convert.Uint8Array.toHexString),
      };
    }

    static fromGenerated(
      value: SerializableTransactionManifest
    ): TransactionManifest {
      return {
        instructions: GeneratedConverter.Instructions.fromGenerated(
          value.instructions
        ),
        blobs: value.blobs.map(Convert.HexString.toUint8Array),
      };
    }
  };

  static TransactionHeader = class {
    static toGenerated(
      value: TransactionHeader
    ): SerializableTransactionHeader {
      return {
        network_id: Convert.Number.toString(value.networkId),
        start_epoch_inclusive: Convert.Number.toString(
          value.startEpochInclusive
        ),
        end_epoch_exclusive: Convert.Number.toString(value.endEpochExclusive),
        nonce: Convert.Number.toString(value.nonce),
        notary_is_signatory: value.notaryIsSignatory,
        notary_public_key: GeneratedConverter.PublicKey.toGenerated(
          value.notaryPublicKey
        ),
        tip_percentage: Convert.Number.toString(value.tipPercentage),
      };
    }

    static fromGenerated(
      value: SerializableTransactionHeader
    ): TransactionHeader {
      return {
        networkId: Convert.String.toNumber(value.network_id),
        startEpochInclusive: Convert.String.toNumber(
          value.start_epoch_inclusive
        ),
        endEpochExclusive: Convert.String.toNumber(value.end_epoch_exclusive),
        nonce: Convert.String.toNumber(value.nonce),
        notaryPublicKey: GeneratedConverter.PublicKey.fromGenerated(
          value.notary_public_key
        ),
        notaryIsSignatory: value.notary_is_signatory,
        tipPercentage: Convert.String.toNumber(value.tip_percentage),
      };
    }
  };

  static TransactionHash = class {
    static toGenerated(value: TransactionHash): SerializableTransactionHash {
      return {
        hash: Convert.Uint8Array.toHexString(value.hash),
        id: value.id,
      };
    }

    static fromGenerated(value: SerializableTransactionHash): TransactionHash {
      return {
        hash: Convert.HexString.toUint8Array(value.hash),
        id: value.id,
      };
    }
  };

  static Intent = class {
    static toGenerated(value: Intent): SerializableIntent {
      return {
        header: GeneratedConverter.TransactionHeader.toGenerated(value.header),
        manifest: GeneratedConverter.TransactionManifest.toGenerated(
          value.manifest
        ),
        message: GeneratedConverter.Message.toGenerated(value.message),
      };
    }

    static fromGenerated(value: SerializableIntent): Intent {
      return {
        manifest: GeneratedConverter.TransactionManifest.fromGenerated(
          value.manifest
        ),
        header: GeneratedConverter.TransactionHeader.fromGenerated(
          value.header
        ),
        message: GeneratedConverter.Message.fromGenerated(value.message),
      };
    }
  };

  static SignedIntent = class {
    static toGenerated(value: SignedIntent): SerializableSignedIntent {
      return {
        intent: GeneratedConverter.Intent.toGenerated(value.intent),
        intent_signatures: value.intentSignatures.map(
          GeneratedConverter.SignatureWithPublicKey.toGenerated
        ),
      };
    }

    static fromGenerated(value: SerializableSignedIntent): SignedIntent {
      return {
        intent: GeneratedConverter.Intent.fromGenerated(value.intent),
        intentSignatures: value.intent_signatures.map(
          GeneratedConverter.SignatureWithPublicKey.fromGenerated
        ),
      };
    }
  };

  static NotarizedTransaction = class {
    static toGenerated(
      value: NotarizedTransaction
    ): SerializableNotarizedTransaction {
      return {
        signed_intent: GeneratedConverter.SignedIntent.toGenerated(
          value.signedIntent
        ),
        notary_signature: GeneratedConverter.Signature.toGenerated(
          value.notarySignature
        ),
      };
    }

    static fromGenerated(
      value: SerializableNotarizedTransaction
    ): NotarizedTransaction {
      return {
        signedIntent: GeneratedConverter.SignedIntent.fromGenerated(
          value.signed_intent
        ),
        notarySignature: GeneratedConverter.Signature.fromGenerated(
          value.notary_signature
        ),
      };
    }
  };

  static EntityType = class {
    static toGenerated(value: EntityType): SerializableEntityType {
      return SerializableEntityType[EntityType[value]];
    }

    static fromGenerated(value: SerializableEntityType): EntityType {
      return EntityType[SerializableEntityType[value]];
    }
  };

  static MessageValidationConfig = class {
    static toGenerated(
      value: MessageValidationConfig
    ): SerializableMessageValidationConfig {
      return {
        max_plaintext_message_length: Convert.BigInt.toString(
          value.maxPlaintextMessageLength
        ),
        max_encrypted_message_length: Convert.BigInt.toString(
          value.maxEncryptedMessageLength
        ),
        max_mime_type_length: Convert.BigInt.toString(value.maxMimeTypeLength),
        max_decryptors: Convert.BigInt.toString(value.maxDecryptors),
      };
    }

    static fromGenerated(
      value: SerializableMessageValidationConfig
    ): MessageValidationConfig {
      return {
        maxPlaintextMessageLength: Convert.String.toBigInt(
          value.max_plaintext_message_length
        ),
        maxEncryptedMessageLength: Convert.String.toBigInt(
          value.max_encrypted_message_length
        ),
        maxMimeTypeLength: Convert.String.toBigInt(value.max_mime_type_length),
        maxDecryptors: Convert.String.toBigInt(value.max_decryptors),
      };
    }
  };

  static ValidationConfig = class {
    static toGenerated(value: ValidationConfig): SerializableValidationConfig {
      return {
        network_id: Convert.Number.toString(value.networkId),
        max_notarized_payload_size: Convert.BigInt.toString(
          value.maxNotarizedPayloadSize
        ),
        min_tip_percentage: Convert.Number.toString(value.minTipPercentage),
        max_tip_percentage: Convert.Number.toString(value.maxTipPercentage),
        max_epoch_range: Convert.BigInt.toString(value.maxEpochRange),
        message_validation:
          GeneratedConverter.MessageValidationConfig.toGenerated(
            value.messageValidation
          ),
      };
    }

    static fromGenerated(
      value: SerializableValidationConfig
    ): ValidationConfig {
      return {
        networkId: Convert.String.toNumber(value.network_id),
        maxNotarizedPayloadSize: Convert.String.toBigInt(
          value.max_notarized_payload_size
        ),
        minTipPercentage: Convert.String.toNumber(value.min_tip_percentage),
        maxTipPercentage: Convert.String.toNumber(value.max_tip_percentage),
        maxEpochRange: Convert.String.toBigInt(value.max_epoch_range),
        messageValidation:
          GeneratedConverter.MessageValidationConfig.fromGenerated(
            value.message_validation
          ),
      };
    }
  };

  static Message = class {
    static toGenerated(value: Message): SerializableMessage {
      switch (value.kind) {
        case "None":
          return { kind: value.kind };
        case "PlainText":
          return {
            kind: value.kind,
            value: GeneratedConverter.PlainTextMessage.toGenerated(value.value),
          };
        case "Encrypted":
          return {
            kind: value.kind,
            value: GeneratedConverter.EncryptedMessage.toGenerated(value.value),
          };
      }
    }

    static fromGenerated(value: SerializableMessage): Message {
      switch (value.kind) {
        case "None":
          return { kind: value.kind };
        case "PlainText":
          return {
            kind: value.kind,
            value: GeneratedConverter.PlainTextMessage.fromGenerated(
              value.value
            ),
          };
        case "Encrypted":
          return {
            kind: value.kind,
            value: GeneratedConverter.EncryptedMessage.fromGenerated(
              value.value
            ),
          };
      }
    }
  };

  static PlainTextMessage = class {
    static toGenerated(value: PlainTextMessage): SerializablePlainTextMessage {
      return {
        mime_type: value.mimeType,
        message: GeneratedConverter.MessageContent.toGenerated(value.message),
      };
    }

    static fromGenerated(
      value: SerializablePlainTextMessage
    ): PlainTextMessage {
      return {
        mimeType: value.mime_type,
        message: GeneratedConverter.MessageContent.fromGenerated(value.message),
      };
    }
  };

  static MessageContent = class {
    static toGenerated(value: MessageContent): SerializableMessageContent {
      switch (value.kind) {
        case "Bytes":
          return {
            kind: value.kind,
            value: Convert.Uint8Array.toHexString(value.value),
          };
        case "String":
          return {
            kind: value.kind,
            value: value.value,
          };
      }
    }

    static fromGenerated(value: SerializableMessageContent): MessageContent {
      switch (value.kind) {
        case "Bytes":
          return {
            kind: value.kind,
            value: Convert.HexString.toUint8Array(value.value),
          };
        case "String":
          return {
            kind: value.kind,
            value: value.value,
          };
      }
    }
  };

  static EncryptedMessage = class {
    static toGenerated(value: EncryptedMessage): SerializableEncryptedMessage {
      return {
        encrypted: Convert.Uint8Array.toHexString(value.encrypted),
        decryptors_by_curve: recordMap(
          value.decryptorsByCurve,
          (key, value) => {
            return [
              key,
              GeneratedConverter.DecryptorsByCurve.toGenerated(value),
            ];
          }
        ),
      };
    }

    static fromGenerated(
      value: SerializableEncryptedMessage
    ): EncryptedMessage {
      return {
        encrypted: Convert.HexString.toUint8Array(value.encrypted),
        decryptorsByCurve: recordMap(
          value.decryptors_by_curve,
          (key, value) => {
            return [
              key,
              GeneratedConverter.DecryptorsByCurve.fromGenerated(value),
            ];
          }
        ),
      };
    }
  };

  static DecryptorsByCurve = class {
    static toGenerated(
      value: DecryptorsByCurve
    ): SerializableDecryptorsByCurve {
      return {
        kind: value.kind,
        value: {
          dh_ephemeral_public_key: Convert.Uint8Array.toHexString(
            value.value.dhEphemeralPublicKey
          ),
          decryptors: value.value.decryptors.reduce(
            (obj: Record<string, string>, [key, value]) => {
              obj[Convert.Uint8Array.toHexString(key)] =
                Convert.Uint8Array.toHexString(value);
              return obj;
            },
            {}
          ),
        },
      };
    }

    static fromGenerated(
      value: SerializableDecryptorsByCurve
    ): DecryptorsByCurve {
      return {
        kind: value.kind,
        value: {
          dhEphemeralPublicKey: Convert.HexString.toUint8Array(
            value.value.dh_ephemeral_public_key
          ),
          decryptors: Object.entries(value.value.decryptors).map(
            ([key, value]) => [
              Convert.HexString.toUint8Array(key),
              Convert.HexString.toUint8Array(value),
            ]
          ),
        },
      };
    }
  };
}

const recordMap = <
  K1 extends string | number | symbol,
  K2 extends string | number | symbol,
  V1,
  V2,
>(
  record: Record<K1, V1>,
  callback: (key: K1, value: V1) => [K2, V2]
): Record<K2, V2> => {
  // @ts-expect-error "Empty object on beginning"
  const newRecord: Record<K2, V2> = {};

  for (const key in record) {
    const value = record[key];
    const [newKey, newValue] = callback(key, value);
    newRecord[newKey] = newValue;
  }

  return newRecord;
};
