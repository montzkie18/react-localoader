import extractStrings from '../lib/extractStrings';
import generateKey from '../lib/utils/generateKey';

describe("#extractStrings", () => {
  it("extracts strings from Localized elements", () => {
    const text = "Hello world";
    const description = "Test";
    const source = [
      'export default () => (',
      `  <div><Localize>${text}</Localize></div>`,
      ');',
    ].join('\n');

    const translations = extractStrings(source, description);
    expect(translations).toEqual({
      [generateKey(text)]: {
        description,
        text
      }
    });
  });

  it("extracts strings from i18n.t method calls", () => {
    const text = "Hello world";
    const description = "Test";
    const source = [
      'export default () => (',
      `  <div>{i18n.t("${text}")}</div>`,
      ');',
    ].join('\n');

    const translations = extractStrings(source, description);
    expect(translations).toEqual({
      [generateKey(text)]: {
        description,
        text
      }
    });
  });

  it("ignores source without Localized elements", () => {
    const source = [
      'export default () => (',
      '  <Icon name="material"/>',
      ');',
    ].join('\n');

    const translations = extractStrings(source);
    expect(Object.keys(translations)).toEqual([]);
  });

  it("ignores Localize elements with multiple children", () => {
    const source = [
      'export default () => (',
      '  <Localize>Hello {world}</Localize>',
      ');',
    ].join('\n');

    const translations = extractStrings(source);
    expect(Object.keys(translations)).toEqual([]);
  });
});