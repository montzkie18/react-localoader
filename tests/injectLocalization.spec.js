import injectLocalization from '../lib/injectLocalization';
import configurations from '../lib/config';

const config = configurations.load();

/**
 * test the following for React elements
 * <div>Hello world</div>
 * <div>Hello <b>world</b></div>
 * <div>Hello <b>world</b> <a>and</a> <i>everyone</i></div>
 * <div>Hello <b>world <img/></b></div>
 * <div>Hello <i>world <b>and the rest</b></i></div>
 * <div>Hello <i><b>world</b></i></div>

 * test the following for interpolated strings
 * <div>Hello {world}</div>
 * <div>Hello {this.props.world}</div>
 * <div>Hello {"world"}</div>
 * <div>Hello {`world and {others}`}</div>
 * <div>{`Hello ${world}`}</div>
 * <div>Hello {isTrue && "world"}</div>
 * <div>Hello {isTrue && `${world}`}</div>

 * test the following for element attributes:
 * <div title="Hello world"/>
 * <div title={`Hello ${world}`}>
 * <div title={<div>Hello world</div>}/>

 * test for combination of elements, interpolated strings and attributes
 * <div>Hello <b>world</b> and {others}</div>
 * <div title="Great work">Hello world</div>
 */
describe("#injectLocalization", () => {
  it("no translations", () => {
    const source = [
      'export default () => (',
      '  <img/>',
      ');',
    ].join('\n');

    expect(injectLocalization(source)).toEqual(source);
  });

  describe("JSXText", () => {
    it("JSXText with alphanumeric text", () => {
      const source = [
        'export default () => (',
        '  <div>Hello world</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize>Hello world</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText with only non-alphanumeric text", () => {
      const source = [
        'export default () => (',
        '  <div>~!@#$%^&*()_+|</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual(source);
    });
  });

  describe("JSXElement", () => {
    it("JSXElement child", () => {
      const source = [
        'export default () => (',
        '  <div><b>Hello world</b></div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><b><Localize>Hello world</Localize></b></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and a single translatable JSXElement", () => {
      const source = [
        'export default () => (',
        '  <div>Hello <b>world</b></div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize elements={[<b>$1</b>]}>Hello *world*</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and multiple translatable JSXElement", () => {
      const source = [
        'export default () => (',
        '  <div>Hello <b>world</b> <a>and</a> <i>everyone</i></div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div>' +
            '<Localize elements={[<b>$1</b>, <a>$1</a>, <i>$1</i>]}>' +
              'Hello *world* **and** ***everyone***' + 
            '</Localize>' + 
          '</div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and a translatable JSXElement with non-translatable child", () => {
      const source = [
        'export default () => (',
        '  <div>Hello <b>world <img/></b></div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize elements={[<b>$1 <img/></b>]}>Hello *world*</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and a translatable JSXElement with a translatable child", () => {
      const source = [
        'export default () => (',
        '  <div>Hello <i>world <b>and the rest</b></i></div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize>Hello</Localize> <i><Localize elements={[<b>$1</b>]}>world *and the rest*</Localize></i></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and a non-translatable JSXElement", () => {
      const source = [
        'export default () => (',
        '  <div><img/>Hello world</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><img/><Localize>Hello world</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and a non-translatable JSXElement with a translatable child", () => {
      const source = [
        'export default () => (',
        '  <div>Hello <i><b>world</b></i></div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize>Hello</Localize> <i><b><Localize>world</Localize></b></i></div>',
        ');',
      ].join('\n'));
    });

    //!TODO: Add support for nested JSXElement?
    // it("JSXText and a nested JSXElement", () => {
    //   const source = [
    //     'export default () => (',
    //     '  <div>Hello <i><b>world</b></i></div>',
    //     ');',
    //   ].join('\n');

    //   expect(injectLocalization(source)).toEqual([
    //     config.componentImport,
    //     'export default () => (',
    //     '  <div elements={[<i><b>$1</b></i>]}><Localize>Hello *world*</Localize></div>',
    //     ');',
    //   ].join('\n'));
    // });
  });

  describe("JSXExpressionContainer", () => {
    it("JSXText and JSXExpressionContainer for an Identifier", () => {
      const source = [
        'export default () => (',
        '  <div>Hello {world}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize',
        '      expressions={{',
        '        "world": world',
        '      }}>Hello %[world]</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and JSXExpressionContainer for a MemberExpression", () => {
      const source = [
        'export default () => (',
        '  <div>Hello {this.props.world}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize',
        '      expressions={{',
        '        "this-props-world": this.props.world',
        '      }}>Hello %[this-props-world]</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and JSXExpressionContainer for a StringLiteral", () => {
      const source = [
        'export default () => (',
        '  <div>Hello {`world`}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize>Hello world</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and JSXExpressionContainer for a TemplateLiteral", () => {
      const source = [
        'export default () => (',
        '  <div>Hello {`world and the ${rest}`}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize',
        '      expressions={{',
        '        "rest": rest',
        '      }}>Hello world and the %[rest]</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXText and non-translatable JSXExpressionContainer", () => {
      const source = [
        'export default () => (',
        '  <div>Hello {world && world.name}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize>Hello</Localize> {world && world.name}</div>',
        ');',
      ].join('\n'));
    });

    it("translatable JSXExpressionContainer", () => {
      const source = [
        'export default () => (',
        '  <div>{`Hello ${world}`}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize',
        '    expressions={{',
        '      "world": world',
        '    }}>Hello %[world]</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXExpressionContainer with arithmetic expressions", () => {
      const source = [
        'export default () => (',
        '  <div>{`${combinationIndex+1} of ${numCombinations}`}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize',
        '    expressions={{',
        '      "combinationIndex1": combinationIndex+1,',
        '      "numCombinations": numCombinations',
        '    }}>%[combinationIndex1] of %[numCombinations]</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXExpressionContainer with StringLiteral imitating html-like tags", () => {
      const source = [
        'export default () => (',
        '  <div>',
        '    {"<"}',
        '  </div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual(source);
    });

    it("JSXExpressionContainer with TemplateLiteral of only non-alphanumeric text", () => {
      const source = [
        'export default () => (',
        '  <div>{`${zoomLevel}% => $${dollarValue}`}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual(source);
    });

    it("JSXExpressionContainer with StringLiteral with new lines", () => {
      const source = [
        'export default () => (',
        '  <div>{',
        '    "Hello world"',
        '  }</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize>Hello world</Localize></div>',
        ');',
      ].join('\n'));
    });

    it("JSXExpressionContainer with MemberExpression", () => {
      const source = [
        'export default () => (',
        '  <div>Hello {(world || {}).name} {(foo || {}).bar}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div><Localize',
        '      expressions={{',
        '        "world-name": (world || {}).name,',
        '        "foo-bar": (foo || {}).bar',
        '      }}>Hello %[world-name] %[foo-bar]</Localize></div>',
        ');',
      ].join('\n'));
    });
  });

  describe("JSXAttribute", () => {
    it("ignore attributes that match config.attributeIgnores", () => {
      const source = [
        'export default () => (',
        '  <div id="Hello world"/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        'export default () => (',
        '  <div id="Hello world"/>',
        ');',
      ].join('\n'));
    });

    it("translates attributes in config.attributeNames regardless of case", () => {
      const source = [
        'export default () => (',
        '  <div idTitle="Hello world"/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.i18nImport,
        'export default () => (',
        '  <div idTitle={i18n.t("Hello world")}/>',
        ');',
      ].join('\n'));
    });

    it("JSXAttribute with StringLiteral", () => {
      const source = [
        'export default () => (',
        '  <div label="Hello world"/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.i18nImport,
        'export default () => (',
        '  <div label={i18n.t("Hello world")}/>',
        ');',
      ].join('\n'));
    });

    it("JSXAttribute with JSXExpressionContainer with StringLiteral child", () => {
      const source = [
        'export default () => (',
        '  <div label={"Hello world"}/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.i18nImport,
        'export default () => (',
        '  <div label={i18n.t("Hello world")}/>',
        ');',
      ].join('\n'));
    });

    it("JSXAttribute with JSXExpressionContainer with TemplateLiteral child", () => {
      const source = [
        'export default () => (',
        '  <div label={`Hello ${world}`}/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.i18nImport,
        'export default () => (',
        '  <div label={i18n.t("Hello %[world]", {',
        '    "world": world',
        '  })}/>',
        ');',
      ].join('\n'));
    });

    it("JSXAttribute with JSXExpressionContainer with Identifier", () => {
      const source = [
        'export default () => (',
        '  <div label={helloWorld}/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        'export default () => (',
        '  <div label={helloWorld}/>',
        ');',
      ].join('\n'));
    });

    it("JSXAttribute with JSXExpressionContainer with MemberExpression", () => {
      const source = [
        'export default () => (',
        '  <div label={this.props.greeting}/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        'export default () => (',
        '  <div label={this.props.greeting}/>',
        ');',
      ].join('\n'));
    });

    it("JSXAttribute with JSXElement", () => {
      const source = [
        'export default () => (',
        '  <div label={<span>Hello world</span>}/>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.componentImport,
        'export default () => (',
        '  <div label={<span><Localize>Hello world</Localize></span>}/>',
        ');',
      ].join('\n'));
    });

    it("JSXAttribute inside translatable JSXElement", () => {
      const source = [
        'export default () => (',
        '  <div>Hello <span tooltip="Hi there">world</span></div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.i18nImport,
        config.componentImport,
        'export default () => (',
        '  <div><Localize elements={[<span tooltip={i18n.t("Hi there")}>$1</span>]}>Hello *world*</Localize></div>',
        ');',
      ].join('\n'));
    });

    //!TODO: Add support for nested TemplateLiterals?
    // it("JSXAttribute with JSXExpressionContainer with nested TemplateLiteral", () => {
    //   const source = [
    //     'export default () => (',
    //     '  <div label={`Hello ${object.var ? `(${object.var})` : ""}`}/>',
    //     ');',
    //   ].join('\n');

    //   expect(injectLocalization(source)).toEqual([
    //     config.i18nImport,
    //     'export default () => (',
    //     '  <div label={i18n.t("Hello %[object-varobject-var]", {',
    //     '    "object-varobject-var": object.var ? `(${object.var})` : ""',
    //     '  })}/>',
    //     ');',
    //   ].join('\n'));
    // });
  });

  describe("combinations", () => {
    it("JSXText, JSXElement, JSXExpressionContainer and JSXAttribute", () => {
      const source = [
        'export default () => (',
        '  <div tooltip="Welcome aboard">Hello <b>world</b> and {others}</div>',
        ');',
      ].join('\n');

      expect(injectLocalization(source)).toEqual([
        config.i18nImport,
        config.componentImport,
        'export default () => (',
        '  <div tooltip={i18n.t("Welcome aboard")}><Localize',
        '      elements={[<b>$1</b>]}',
        '      expressions={{',
        '        "others": others',
        '      }}>Hello *world* and %[others]</Localize></div>',
        ');',
      ].join('\n'));
    });
  });
});