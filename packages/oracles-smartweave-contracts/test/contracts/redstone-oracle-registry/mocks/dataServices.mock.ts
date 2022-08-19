export const mockDataServices = [...Array(6).keys()].reduce(
  (mockNodes, currentIndex) => ({
    ...mockNodes,
    ...{
      [`testId${currentIndex + 1}`]: {
        name: `testName${currentIndex + 1}`,
        logo: "logo",
        description: "testDescription",
        manifestTxId: "testManifestId",
        admin: "testAddress",
      },
    },
  }),
  {}
);
