import i18n from '../lib/i18n';
import generateKey from '../lib/utils/generateKey';

describe("#extractStrings", () => {
  beforeEach(() => {
    i18n.locale = "zh";
    i18n.translations = {
      [generateKey("Hello world")]: {
        description: "greeting",
        text: "你好，世界"
      },
      [generateKey("Test %[placeholder]")]: {
        description: "test",
        text: "测试 %[placeholder]"
      },
    };
  });

  it("Retrieves translation for text", () => {
    expect(i18n.t("Hello world")).toEqual("你好，世界");
  });

  it("Replaces placeholders in translation", () => {
    expect(i18n.t("Test %[placeholder]", {placeholder: "100% passed"})).toEqual("测试 100% passed");
  });
});