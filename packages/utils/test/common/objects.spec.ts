import { mergeObjects } from "../../src/common/objects";

it("should merge array of objects into one object", () => {
  // given
  const prices = [
    {
      source1: [
        {
          token1: 123,
          token2: 324,
        },
      ],
    },
    {
      source2: [
        {
          token3: 555,
          token4: 666,
        },
      ],
    },
    {
      source3: [
        {
          token5: 777,
          token6: 888,
        },
      ],
      source4: [
        {
          token7: 999,
          token8: 232,
        },
      ],
    },
  ];

  // when
  const result = mergeObjects(prices);

  // then
  expect(result).toEqual({
    source1: [
      {
        token1: 123,
        token2: 324,
      },
    ],
    source2: [
      {
        token3: 555,
        token4: 666,
      },
    ],
    source3: [
      {
        token5: 777,
        token6: 888,
      },
    ],
    source4: [
      {
        token7: 999,
        token8: 232,
      },
    ],
  });
});
