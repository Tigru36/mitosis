import {
  compileAwayBuilderComponentsFromTree,
  components as compileAwayComponents,
} from '../../plugins/compile-away-builder-components';
import { MitosisComponent } from '../../types/mitosis-component';
import { renderHandlers } from './handlers';
import { renderJSXNodes } from './jsx';
import {
  arrowFnBlock,
  arrowFnValue,
  File,
  INDENT,
  invoke,
  NL,
  SrcBuilder,
  SrcBuilderOptions,
  UNINDENT,
} from './src-generator';
import { collectStyles, renderStyles } from './styles';

export type QwikOptions = {
  qwikLib?: string;
  qrlPrefix?: string;
  output?: 'ts' | 'cjs' | 'mjs';
  jsx?: boolean;
  minify?: boolean;
};

export interface FileSet {
  high: File;
  med: File;
  low: File;
}

export function createFileSet(options: QwikOptions = {}): FileSet {
  const opts: Required<QwikOptions> = {
    qwikLib: '@builder.io/qwik',
    qrlPrefix: './',
    output: 'ts',
    minify: false,
    jsx: true,
    ...options,
  };
  const extension =
    (opts.output == 'mjs' ? 'js' : opts.output) + (opts.jsx ? 'x' : '');
  const srcOptions: SrcBuilderOptions = {
    isPretty: !opts.minify,
    isModule: opts.output != 'cjs',
    isTypeScript: opts.output == 'ts',
    isJSX: opts.jsx,
  };
  return {
    high: new File(
      'high.' + extension,
      srcOptions,
      opts.qwikLib,
      opts.qrlPrefix,
    ),
    med: new File('med.' + extension, srcOptions, opts.qwikLib, opts.qrlPrefix),
    low: new File('low.' + extension, srcOptions, opts.qwikLib, opts.qrlPrefix),
  };
}

export function addComponent(fileSet: FileSet, component: MitosisComponent) {
  const start = new Date().getTime();
  compileAwayBuilderComponentsFromTree(component, compileAwayComponents);
  const end = new Date().getTime();
  console.log('compileAwayBuilderComponentsFromTree', end - start);
  const componentName = component.name;
  const handlers = renderHandlers(
    fileSet.high,
    componentName,
    component.children,
  );
  // If the component has no handlers, than it is probably static
  // and so it is unlikely to be re-rendered on the client, therefore
  // put it in a low priority bucket.
  const isStatic = handlers.size == 0;
  const onRenderFile = isStatic ? fileSet.low : fileSet.med;
  const componentFile = fileSet.med;
  if (!componentFile.exports.get('onMountCreateEmptyState')) {
    componentFile.exportConst(
      'onMountCreateEmptyState',
      function (this: SrcBuilder) {
        this.emit(
          invoke(
            componentFile.import(componentFile.qwikModule, 'qHook'),
            [arrowFnValue([], ['({})'])],
            ['any', 'any'],
          ),
        );
      },
    );
  }
  if (component.hooks.onMount) {
    addComponentOnMount(componentFile, componentName, component);
  }
  const styles = collectStyles(component.children);
  const qComponentOptions: Record<string, any> = {
    // tagName: string(componentName.toLowerCase()),
    onMount: invoke(componentFile.import(componentFile.qwikModule, 'qHook'), [
      componentFile.toQrl(
        component.hooks.onMount
          ? componentName + '_onMount'
          : 'onMountCreateEmptyState',
      ),
    ]),
    onRender: invoke(componentFile.import(componentFile.qwikModule, 'qHook'), [
      onRenderFile.toQrl(componentName + '_onRender'),
    ]),
  };
  if (styles.size) {
    qComponentOptions.styles = onRenderFile.toQrl(componentName + '_styles');
    onRenderFile.exportConst(componentName + '_styles', renderStyles(styles));
  }
  componentFile.exportConst(
    componentName,
    invoke(
      componentFile.import(componentFile.qwikModule, 'qComponent'),
      [qComponentOptions],
      ['any', 'any'],
    ),
  );

  onRenderFile.src.emit(NL);
  onRenderFile.exportConst(
    componentName + '_onRender',
    invoke(onRenderFile.import(onRenderFile.qwikModule, 'qHook'), [
      arrowFnValue(
        ['props', 'state'],
        renderJSXNodes(onRenderFile, handlers, component.children, styles),
      ),
    ]),
  );
}

function addComponentOnMount(
  componentFile: File,
  componentName: string,
  component: MitosisComponent,
) {
  componentFile.exportConst(
    componentName + '_onMount',
    function (this: SrcBuilder) {
      this.emit(
        invoke(
          componentFile.import(componentFile.qwikModule, 'qHook'),
          [
            arrowFnValue([], () =>
              this.emit(
                '{',
                NL,
                INDENT,
                'const state = {};',
                NL,
                component.hooks.onMount,
                NL,
                'return state;',
                UNINDENT,
                NL,
                '}',
              ),
            ),
          ],
          ['any', 'any'],
        ),
      );
    },
  );
}
