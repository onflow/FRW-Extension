export type PublicKeyTuple = {
  P256: { pubK: string };
  SECP256K1: { pubK: string };
};

export type PublicPrivateKeyTuple = PublicKeyTuple & {
  P256: { pubK: string; pk: string };
  SECP256K1: { pubK: string; pk: string };
};
