import { updateQueryParam } from '../../plugins/compile-away-builder-components';
import { MitosisNode } from '../../types/mitosis-node';
import { INDENT, SrcBuilder, NL, WS, UNINDENT } from './src-generator';

export const DIRECTIVES: Record<
  string,
  (node: MitosisNode, blockFn: () => void) => void
> = {
  /*
  CustomCode: (node: MitosisNode, blockFn: () => void) =>
    function (this: SrcBuilder) {
      console.log('IMPLEMENT: CustomCode')
      blockFn();
    },
  Column: (node: MitosisNode, blockFn: () => void) =>
  function (this: SrcBuilder) {
    console.log('IMPLEMENT: Column')
    blockFn();
  },
  Columns: (node: MitosisNode, blockFn: () => void) =>
    function (this: SrcBuilder) {
      console.log('IMPLEMENT: Columns')
      blockFn();
    },
  CoreButton: (node: MitosisNode, blockFn: () => void) =>
    function (this: SrcBuilder) {
      console.log('IMPLEMENT: CoreButton')
      blockFn();
    },
  CoreSection: (node: MitosisNode, blockFn: () => void) =>
    function (this: SrcBuilder) {
      console.log('IMPLEMENT: CoreSection')
      blockFn();
    },
  Image: (node: MitosisNode, blockFn: () => void) =>
    function (this: SrcBuilder) {
      const properties = node.properties
      if (properties.href) {
        this.jsxBegin('a', {href: properties.href}, {});
      }
      this.jsxBegin('picture', {}, {});

      const srcset = properties.srcset;
      const widths = [100, 200, 400, 800, 1200, 1600, 2000];
      const srcSet =
    srcset ||
    `${
      (node.properties.image || '').match(/builder\.io/)
        ? widths
            .map(
              (size) =>
                `${updateQueryParam(
                  node.properties.image,
                  'width',
                  String(size),
                )} ${size}w`,
            )
            .concat([node.properties.image!])
            .join(', ')
        : ''
    }`;
      const props = {
        position: 'absolute',
        height: '100%',
        width: '100%',
        top: '0',
        left: '0'
      }
      blockFn();
      this.jsxEnd('picture');
      if (properties.href) {
        this.jsxEnd('a');
      }
    },
  Video: (node: MitosisNode, blockFn: () => void) =>
    function (this: SrcBuilder) {
      console.log('IMPLEMENT: Video')
      blockFn();
    },
    */
  Show: (node: MitosisNode, blockFn: () => void) =>
    function (this: SrcBuilder) {
      const expr = node.bindings.when;
      if (this.isJSX) {
        this.emit('{', WS, INDENT, expr, WS, '?', NL);
      } else {
        this.emit(expr, WS, '?', INDENT, NL);
      }
      blockFn();
      if (this.isJSX) {
        this.emit(':', WS, 'null', UNINDENT, NL, '}', NL);
      } else {
        this.emit(':', WS, 'null', UNINDENT, NL);
      }
    },
};
