import React, {Fragment} from 'react';
import Enzyme, {shallow} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Localize from '../../lib/components/Localize';
import 'jest-enzyme';

Enzyme.configure({adapter: new Adapter()});

describe("Localize component", () => {
  it("only supports a single string as child", () => {
    let error;
    try {
      shallow(<Localize>Hello <b>world</b></Localize>);
    }catch(e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
  });

  it("returns plaintext child", () => {
    const element = shallow(<Localize>Hello world</Localize>);
    expect(element.children()).toHaveText("Hello world");
  });

  it("swaps elements", () => {
    const element = shallow(
      <Localize elements={[<b>$1</b>, <i>$1</i>]}>
        Hello *world* and the **others**
      </Localize>
    );

    expect(element.children()).toHaveLength(4);
    expect(element.find("b")).toContainReact(<b>world</b>);
    expect(element.find("i")).toContainReact(<i>others</i>);
  });

  it("swaps expressions", () => {
    const user = "Tester1";
    const planet = "Earth";
    const element = shallow(
      <Localize expressions={{"user": user, "planet": planet}}>
        Hello %[user] welcome to %[planet]
      </Localize>
    );

    expect(element.children()).toHaveText(`Hello ${user} welcome to ${planet}`);
  });

  it("swaps elements and expressions", () => {
    const user = "Tester1";
    const planet = "Earth";
    const element = shallow(
      <Localize 
        elements={[<b>$1</b>, <i>$1</i>]}
        expressions={{"user": user, "planet": planet}}>
        Hello *%[user]* welcome to **%[planet]**
      </Localize>
    );

    expect(element.children()).toHaveLength(4);
    expect(element.find("b")).toContainReact(<b>{user}</b>);
    expect(element.find("i")).toContainReact(<i>{planet}</i>);
  });
});