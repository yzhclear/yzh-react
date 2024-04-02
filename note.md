## 一. 项目初始化

```
pnpm init

pnpm i eslint -D -w

npx eslint --init

pnpm i -D -w @typescript-eslint/eslint-plugin @typescript-eslint/parser

pnpm i -D -w typescript

pnpm i -D -w prettier

pnpm i -D -w eslint-config-prettier # 覆盖eslint本身的规则

pnpm i -D -w eslint-plugin-prettier # 用 Prettier来接管接管修复代码 即 eslint --fix
```

commit 规范

```
pnpm i -D -w husky@8
npx husky install
npx husky add .husky/pre-commit "pnpm lint"


pnpm i -D -w commitlint @commitlint/cli @commitlint/config-conventional
npx husky add .husky/commit-msg "npx --no-install commitlint -e $HUSKY_GIT_PARAMS"
```

打包工具

```
pnpm i -D -w rollup
```

## 二. JSX 转换

React项目结构:

- react: 宿主环境无关的公用方法
- react-reconciler: 协调器的实现， 宿主环境无关
- 各种宿主环境的包
- shared公用辅助方法， 宿主环境相关
  JSX转换属于react包

包括两部分：

- 编译时
- 运行时： jsx方法或React.createElement方法的实现(包括dev、prod两个环境)

编译时由 babel 编译实现， 我们来实现运行时， 工作量包括

- 实现jsx方法
- 实现打包流程
- 实现调试打包结果的环境

### 实现jsx方法

包括:

- jsxDEV方法（dev环境）
- jsx方法（prod环境）
- React.createElement方法

### 实现打包流程

对应上述3方法， 打包对应文件

- react/jsx-dev-runtime.js(dev环境)
- react/jsx-runtime.js(prod环境)
- react

#### 打包文件

```
pnpm i -D -w rollup-plugin-typescript2
pnpm i -D -w @rollup/plugin-commonjs

pnpm i -D -w rimraf

pnpm i -D -w rollup-plugin-generate-package-json
```

#### 调试打包结果

```
cd dist/node_modules/react
pnpm link  --global

pnpm link react --global
```

## 三. 初探Reconciler

- 消费JSX
- 没有编译优化
- 开放通用API供不同宿主环境使用

### 核心模块消费JSX的过程

**核心模块操作的数据结构是？**
当前已知的数据结构： React Element

React Element如果作为核心模块操作的数据结构， 存在的问题：

- 无法表达节点之间的的关系
- 字段有限， 不好扩展（如： 无法表达状态）

所以， 需要一种新的数据结构， 它的特点：

- 介于 React Element 与 真实UI节点之间
- 能够表达节点之间的的关系
- 方便扩展(不仅作为数据存储单元， 也能作为工作单元)

这就是FiberNode(虚拟DOM在React中的实现)

当前我们了解的节点类型：

- JSX
- React Element
- FiberNode
- DOM Element

### Reconcile的工作方式

对于同一个节点， 比较其React Element 与 FiberNode， 生成子 FiberNode。
并根据比较的结果生成不同标记(插入、删除、移动...)， 对应不同宿主环境API的执行

### 如何触发更新

常见的触发更新的方式:

- ReactDOM.createRoot().render(或者老版的ReactDOM.render)
- this.setState
- useState的dispatch方法

更新机制的组成部分

- 代表更新的数据结构 -- update
- 消费update的数据结构 -- UpdateQueue

接下来的工作包括：

- 实现mount时调用的API
- 将该API接入上述更新机制中

需要考虑的事情：

- 更新可能发生于任意组件， 而更新流程是从根节点递归的
- 需要一个同意的根节点保存通用信息

## 五.初探mount流程

更新流程的目的：

- 生成wip fiberNode树
- 标记副作用flags

更新流程的步骤：

- 递： beginWork
- 归： completeWork

### beginWork

```
<A>
  <B/>
</A>
```

当进入A的beginWork时， 通过对比B current fiberNode 与 B reactElement, 生成B对应的wip fiberNode,
在此过程中最多会标记2类与 结构变化 相关的 flags

- Placement
- ChildDeletion

### 实现与Host相关节点的beginWork

为开发环境增加**DEV**标识

```
pnpm i -D -w @rollup/plugin-replace
```

HostRoot的 beginWork 功能流程：

1. 计算状态的最新值
2. 创造子FiberNode

### beginWork 优化策略

考虑如下结构的 reactElement:

```html
<div>
	<p>练习时长</p>
	<span>两年半</span>
</div>
```

理论上mount流程完毕后包含的flags:

- 两年半 Placement
- span Placement
- 练习时长 Placement
- p Placement
- div Placement

相比较与执行5次 Placement, 我们可以构建好 离屏DOM树 后， 对 div 执行1次 Placement

**注意**
上述mount时， 如果不给每个要更新的ReactElement打上 Placement 标记， 那么是不是没有节点有 Placement 标记， 那么是不是无法创建更新呢？
其实在首屏渲染时， 为一个有 workInProgress 的节点是 HostRootNode, 那么这个FiberNode其实会进入 update流程， 也就是会打上 Placement 标记

### completeWork

- 对于Host类型的fiberNode, 构建离屏DOM树
- 标记Update Flag

#### completeWork性能优化策略

flags分布在不同fiberNode中， 如何快速找到他们？
答案： 利用completeWork向上遍历(归)的流程， 将子fiberNode的flags冒泡到父fiberNode

## 六. 初探ReactDom

react内部三个阶段

- schedule阶段
- render阶段（beginWork completeWork）
- commit阶段（commitWork）

### Commit阶段的三个子阶段

- beforeMutation阶段
- mutation阶段
- layout阶段

### 当前commit阶段要执行的任务

- fiber树的切换
- 执行Placement对应操作

### 打包ReactDOM

- 兼容原版React的导出
- 处理HostConfig的指向
  - tsconfig.js 修改
  - 类似 webpack resolve alias的功能， 在rollup中使用

## 八 实现useState

hook脱离FC上下文， 仅仅是普通函数， 如何让他拥有感知上下文环境的能力

比如说：

- hook如何知道在另一个hook的上下文环境内执行

```js
function App() {
	useEffect(() => {
		// 执行useState时怎么知道处在 useEffect 上下文
		useState(0);
	});
}
```

- hook怎么知道当前是mount还是update?
  - 解决方案： 在不同上下文中调用的hook不是同一个函数

实现 内部数据共享层 时的注意事项：
以浏览器为例， Reconciler + hostConfig = ReactDOM

增加 内部数据共享层， 意味着Reconciler与React产生关联， 进而意味着ReactDOM与React产生关联

如果两个包产生关联， 在打包时需要考虑： 两者的代码是打包在一起还是分开？

如果打包在一起， 意味着打包后的ReactDOM中会包含React的代码， 那么ReactDOM中会包含一个内部数据共享层， React中也会包含一个内部数据共享层， 这两者不是同一个内部数据共享层。

而我们希望两者共享数据， 所以不希望ReactDOM中会包含React的代码

- hook如何知道自身数据保存在哪

  - 答案： 可以记录在当前正在render的FC对应的fiberNode， 在fiberNode中保存hook数据

    ### 实现Test Utils测试工具

来源于 ReactTestUtils, 特点是使用ReactDOM作为宿主环境

实现测试环境

```shell
pnpm i -D -w jest jest-config jest-environment-jsdom
```

增加jest.config.js配置

```js
const { defaults } = require('jest-config');

module.exports = {
	...defaults,
	rootDir: process.cwd(),
	modulePathIgnorePatterns: ['<rootDir>/.history'],
	moduleDirectories: [
		// 对于 React  ReactDOM
		'dist/node_modules',
		// 对于第三方依赖
		...defaults.moduleDirectories
	],
	testEnvironment: 'jsdom'
};
```

为jest增加JSX解析能力， 安装Babel

```shell
pnpm i -D -w @babel/core @babel/preset-env @babel/plugin-transform-react-jsx
```

## 十二. 实现Diff算法

### 单节点diff

当前仅实现了单一节点的增/删操作，即「单节点Diff算法」

对于 **reconcileSingleElement** 的改动当前支持的情况：

- A1->B1
- A1->A2

需要支持的情况：

- ABC->A

「单/多节点」是指「更新后是单/多节点」。

更细致的，我们需要区分4种情况：

• key相同，type相同 == 复用当前节点， 并删除剩余的兄弟节点

例如： A1B2C3 -> A1

• key相同，type不同== 不存在任何复用的可能性， 删除当前所有节点， 重新创建

例如：A1B2C3 -> B1

- key不同，type相同 == 当前节点不能复用
- key不同，type不同 == 当前节点不能复用
  - key不同的情况， 就有可能是顺序变了， 所以需要去遍历旧的兄弟节点， 重新diff
    - 比如： A1B2C3 -> C3. 刚开始时 A1 与 C3 key不同， 则需要继续遍历A1的兄弟节点 B2 和 C3与C3做diff

### 对于reconcileSingleTextNode的改动

类似于 **reconcileSingleElement**

### 多节点diff

对于同级多节点Diff的支持单节点需要支持的情况：

- 插入 Placement
- 删除 ChildDeletion

多节点需要支持的情况：

- Placement
- 别除 ChildDeletion
- 移动 Placement

整体流程分为4步。

1. 将current中所有同级fiber保存在Map中
2. 遍历newChild数组，对于每个遍历到的element，存在两种情况：

- 在Map中存在对应current fiber，且可以复用

- 在Map中不存在对应current fiber，或不能复用

- 判断是插入还是移动

- 最后Map中剩下的都标记删除

#### 步骤2——是否复用详解

首先，根据key从Map中获取current fiber，如果不存在current fiber, 则没有复用的可能。

接下来，分情况讨论：

- element是HostText, current fiber是么？
  - 是， 则复用
  - 不是， 则新建fiber节点
- element是其他ReactElement, current fiber是么？
  - 判断type是否相同， 相同， 则复用， 否则新建一个fiber
- TODO element是数组或Fragment, current fiber是么？

```txt
<ul>
  <li></li>
  <li></li>
  {[<li/>,<li/>]}
</ul>

<ul>
  <li></li>
  <li></li>

  <>
  	<li/>
  	<li/>
	</>
</ul>
```

#### 步骤3—-插入/移动判断 详解

「移动」具体是指「向右移动」

移动的判断依据：element的index与「element对应current fiber」 index的比较

A1 B2 C3-> B2 C3 A1

0 1 2 0 1 2

当遍历element时，「当前遍历到的element」一定是「所有已遍历的element」中最靠右那个。

所以只需要记录最后一个可复用fiber在current中的index（lastPlacedlndex），在接下来的遍历中：

- 如果接下来遍历到的可复用fiber的index ＜lastPlacedlndex，则标记Placement

- 否则，不标记

##### 移动操作的执行

Placement同时对应：

- 移动
- 插入

对于插入操作，之前对应的DOM方法是 parentNode.appendChild，现在为了实现移动操作，需要支持parentNode.insertBefore。

parentNode.insertBefore需要找到「目标兄弟Host节点」，要考虑2个因素：
• 可能并不是目标fiber的直接兄弟节点

```jsx
// 情况1
<A/><B/>
function B() {
  return <div/>
}

// 情况2
<App/><div/>
function App() {
  return <A/>
}
```

• 不稳定的Host节点不能作为「目标兄弟Host节点」

- A为Placement节点， 然后B是以A为一句的Placement节点， 则A为不稳定的Host节点

不足
• 不支持数组与Fragment

## 第十二 实现Fragment

为了提高组件结构灵活性，需要实现Fragment，需要区分几种情況：

1. Fragment包裹其他组件

```jsx
<>
  <div></div>
  <div></div>
</>

// 对应DOM
<div></div>
<div></div>
```

这种情况的JSX转换结果

```js
jsxs(Fragment, {
	children: [jsx('div', {}), jsx('div', {})]
});
```

type为Fragment的ReactElement，对单一节点的Diff需要考虑Fragment的情况

2. Fragment与其他组件同级

```jsx
<ul>
  <>
    <li>1</li>
    <li>2</li>
  </>

  <li>3</li>
  <li>4</li>
</ul>

// 对应DOM
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
  <li>4</li>
</ul>
```

对应编译的结果：

```js
jsxs('ul', {
	children: [
		jsxs(Fragment, {
			children: [
				jsx('li', {
					chilren: '1'
				}),
				jsx('li', {
					chilren: '2'
				})
			]
		}),
		jsx('li', {
			chilren: '3'
		}),
		jsx('li', {
			chilren: '4'
		})
	]
});
```

children为数组类型，则进入reconcileChildrenArray方法，数组中的某一项为Fragment，所以需要增加「type为
Fragment的ReactElement的判断」，同时beginWork中需要增加Fragment类型的判断。

3. 数组形式的Fragment

```jsx
// arr = [<li>c</li>, <li>d</li>]
<ul>
  <li>a</li>
  <li>b</li>
  {arr}
</ul>

// 对应DOM
<ul>
  <li>a</li>
  <li>b</li>
  <li>c</li>
  <li>d</li>
</ul>
```

对应编译的结果：

```js
jsxs('ul', {
	children: [
		jsx('li', {
			chilren: 'a'
		}),
		jsx('li', {
			chilren: 'b'
		}),
		arr
	]
});
```

children为数组类型，则进入reconcileChildrenArray方法，数组中的某一项为数组，所以需要增加reconcileChildrenArray中数组类型的判断」。

### Fragment对ChildDeletion的影响

ChildDeletion删除DOM的逻辑：
• 找到子树的根Host节点
• 找到子树对应的父级Host节点
• 从父级Host节点中删除子树根Host节点考虑删除p节点的情况：

```html
<div>
	<p>xxx</p>
</div>
```

考虑删除Fragment后，子树的根Host节点可能存在多个：

```js
<div>
	<>
		<p>xxx</p>
		<p>yyy</p>
	</>
</div>
```

#### 对React的影响

需要导出 Fragment 类型， 供babel编译器使用

## 14.lane模型

实现同步调度流程
更新到底是同步还是异步？

```js
class App extends React.Component {
	onclick() {
		this.setState({ a: 1 });
		console.log(this.state.a);
	}
}
```

当前的现状：

- 从触发更新到render，再到commit都是同步的
- 多次触发更新会重复多次更新流程

可以改进的地方：多次触发更新，只进行一次更新流程
「Batched Updates（批处理）」：多次触发更新，只进行一次更新流程
将多次更新合并为一次，理念上有点类似防抖、节流，我们需要考虑合并的时机是：

- 宏任务？
- 微任务？
  用三款框架实现Batched Updates，打印结果不同：
- React
- Vue
- Svelte

结论：React批处理的时机既有宏任务，也有微任务。

本节课我们来实现「微任务的批处理」。

### 新增调度阶段

既然我们需要「多次触发更新、只进行一次更新流程」，意味着我们要将更新合并，所以在：
render阶段, commit阶段的基础上增加schedule阶段（调度阶段）

#### 对update的调整

「多次触发更新，只进行一次更新流程」中「多次触发更新」总味看对于同一个fiber，会创建多个update：

```js
const onclick = () => {
	// 创建3个update
	updateCount((count) => count + 1);
	updateCount((count) => count + 1);
	updateCount((count) => count + 1);
};
```

「多次触发更新，只进行一次更新流程」，意味着要达成
3个目标：

1. 需要实现一套优先级机制，每个更新都拥有优先级
2. 需要能够合并一个宏任务/微任务中触发的所有更新
3. 需要一套算法，用于决定哪个优先级优先进入render阶段

所以， updateQueue 形成一个环状链表的目的是为了保存多个update, 即实现批处理。
否则每调用一次dispatchState, 后面的update会把前面的覆盖掉

### 实现目标1:Lane模型

包括：

- lane（二进制位，代表优先级）
- lanes（二进制位，代表lane的集合）
  其中：
- lane作为update的优先级
- lanes作为lane的集合

#### lane的产生

对于不同情况触发的更新，产生lane。为后续不同事件产生不同优先级更新做准备。
如何知道哪些lane被消费，还剩哪些lane没被消费？

对FiberRootNode的改造需要增加如下字段：

- 代表所有未被消费的lane的集合: pendingLanes
- 代表本次更新消费的lane: finishedLane

### 实现目标2、3

需要完成两件事：

- 实现「某些判断机制」，选出一个lane
- 实现类似防抖、节流的效果，台并宏/微任务中触发的更新

#### render阶段的改造

processUpdateQueue方法消费update时需要考虑：

- lane的因素
- update现在是一条链表，需要遍历

commit阶段的改造移除「本次更新被消费的lane」

## 15 实现Effect

### effect数据结构

数据结构需要考虑：

- 不同effect可以共用同一个机制
  - useEffect
  - useLayoutEffect
  - uselnsertionEffect
- 需要能保存依赖
- 需要能保存create回调

- 需要能保存destroy回调
- 需要能够区分是否需要触发create回调
  - mount时
  - 依赖变化时

```js
const effect = {
	tag,
	create,
	destroy,
	deps,
	next
};
```

注意区分本节课新增的3个flag：

- 对于fiber，新增 PassiveEffect，代表「当前fiber
  本次更新存在副作用」
- 对于effect hook,Passive代表 useEffect对应effect
  • 对于effect hook, HookHasEffect 代表「当前effect本次更新存在副作用」

同时 为了方便使用，最好和其他effect连接成链表

### 实现useEffect

#### 调度副作用

调度需要使用Scheduler（调度器），调度器也属于React
项目下的模块。在本课程中，我们不会实现调度器，但会教如何使用它。

```shell
pnpm i -w scheduler
pnpm i -D -w @types/scheduler
```

#### 收集回调

回调包括两类：

- create回调
- destroy回调

这意味着我们需要收集两类回调：

- unmout时执行的destroy回调
- update时执行的create回调

#### 执行副作用

本次更新的任何create回调都必须在所有上一次更新的destroy回调执行完后再执行。
整体执行流程包括：

1. 遍历effect
2. 首先触发所有unmount effect，且对于某个fiber，如果触发了unmount destroy，本次更新不会再触发 update create
3. 触发所有上次更新的destroy
4. 触发所有这次更新的create

#### mount、 update时的区别

- mount: 一定标记PassiveEffect
- update时：deps变化时标记PassiveEffect

## 第16课 实现noop-renderer

到目前为止我们实现的模块：
• 核心模块：Reconciler
• 公用方法：React
• 浏览器宿主环境：ReactDOM
当前项目的问题：测试用例太单薄，无法照顾到项目的边界情况，但课程时长有限，无法覆盖所有用例解决办法：构建成熟的React测试环境，实现测试工具，按需跑通用例.

为了测试Reconciler，我们需要构建「宿主环境无关的渲染器」，这就是react-noop-renderer
创建packages/react-reconciler/src/_tests_/ReactEffectOrdering-test.js




Noop-Renderer包括两部分：

- hostConfig
- 工厂函数（类似ReactDOM）

在ReactDOM宿主环境的原生节点是DOM节点，在Noop-Renderer宿主环境包括三类节点：

- Instance（HostComponent）

```js
const instance = {
	id: instanceCounter++,
	type: type,
	children: [],
	parent: -1,
	props
};
```

- Textinstance (HostText)

```js
const textInstance = {
	text: content,
	id: instanceCounter++,
	parent: -1
};
```

* Container (HostRoot)
```js
const textInstance = {
	id: idCounter++,
	children: [],
};
```


对于如下组件：
```js
function App() {
	return (
		<>
			<Child />
			<div>hello world</div>
		</>
	)
}

function Child() {
	return 'Child'
}
```
经由Noop-Renderer渲染后得到的树状结构


#### 完善Reconciler测试环境
需要思考的问题：如何在并发环境测试运行结果？比如：
* 如何控制异步执行的时间？使用 mock timer
* 如何记录并发情况下预期的执行顺序？
完善井发测试环境
安装并发的测试上下文环境：
```shell
pnpm i -D -w jest-react
```
安装matchers
* reactTestMatchers.js


#### 当前为测试做的准备
* 针对ReactDOM宿主环境：ReactTestUtils
* 针对Reconciler的测试：React-Noop-Renderer
* 针对并发环境的测试：jest-react、Scheduler、React-Noop-Renderer配合使用

## 第17课 并发更新的原理
本节课对标《React设计原理》5.1节。
思考一个问题：我们当前的实现是如何驱动的？
1. 交互触发更新
2. 调度阶段微任务调度（ensureRootlsScheduled方法）
3. 微任务调度结束，进入render阶段
4. render阶段结束，进入commit阶段
5. commit阶段结束，调度阶段微任务调度（ensureRootlsScheduled方法）

整体是个大的微任务循环，循环的驱动力是「微任务调度模块」。


并发更新的理论基础
**时间切片**

### 改造示例
如果我们想在宏任务中完成任务调度，本质上是个大的宏任务循环，循环的驱动力是Scheduler。
理论基础参考《React设计原理》
在微任务调度中，没有「优先级」的概念，对于Scheduler存在5种优先级：
•ImmediatePriority
•UserBlockingPriority
•NormalPriority
• LowPriority
•IdlePriority

需要考虑的情况：

### 工作过程仅有一个work
如果仅有一个work，Scheduler有个优化路径：如果调度的回调函数的返回值是函数，则会继续调度返回的函数。
### 工作过程中产生相同优先级的work
如果优先级相同，则不需要开启新的调度。
### 工作过程中产生更高/低优先级的work
把握一个原则：我们每次选出的都是优先级最高的work。


## 第18课 实现并发更新
需要做的改动
• Lane模型增加更多优先级
• 交互与优先级对应
• 调度阶段引入Scheduler，新增调度策略逻辑
• render阶段可中断
• 根据update计算state的算法需要修改
扩展交互
思考一个问题：优先级从何而来？
答案：不同交互对应不同优先级。
可以根据「触发更新的上下文环境」赋予不同优先级。比如：
• 点击事件需要同步处理
• 滚动事件优先级再低点
•
••
更进一步，还能推广到任何「可以触发更新的上下文环境」，比如：
• useEffect create回调中触发更新的优先级
同
• 首屏渲染的优先级