
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
* react: 宿主环境无关的公用方法
* react-reconciler: 协调器的实现， 宿主环境无关
* 各种宿主环境的包
* shared公用辅助方法， 宿主环境相关
JSX转换属于react包


包括两部分：
* 编译时
* 运行时： jsx方法或React.createElement方法的实现(包括dev、prod两个环境)

编译时由 babel 编译实现， 我们来实现运行时， 工作量包括
* 实现jsx方法
* 实现打包流程
* 实现调试打包结果的环境



### 实现jsx方法

包括:

* jsxDEV方法（dev环境）
* jsx方法（prod环境）
* React.createElement方法



### 实现打包流程

对应上述3方法， 打包对应文件

* react/jsx-dev-runtime.js(dev环境)
* react/jsx-runtime.js(prod环境)
* react

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
* 消费JSX
* 没有编译优化
* 开放通用API供不同宿主环境使用

### 核心模块消费JSX的过程
**核心模块操作的数据结构是？**
当前已知的数据结构： React Element

React Element如果作为核心模块操作的数据结构， 存在的问题：
* 无法表达节点之间的的关系
* 字段有限， 不好扩展（如： 无法表达状态）


所以， 需要一种新的数据结构， 它的特点：
* 介于 React Element 与 真实UI节点之间
* 能够表达节点之间的的关系
* 方便扩展(不仅作为数据存储单元， 也能作为工作单元)

这就是FiberNode(虚拟DOM在React中的实现)


当前我们了解的节点类型：
* JSX
* React Element
* FiberNode
* DOM Element

### Reconcile的工作方式
对于同一个节点， 比较其React Element 与 FiberNode， 生成子 FiberNode。
并根据比较的结果生成不同标记(插入、删除、移动...)， 对应不同宿主环境API的执行


### 如何触发更新
常见的触发更新的方式:
* ReactDOM.createRoot().render(或者老版的ReactDOM.render)
* this.setState
* useState的dispatch方法

更新机制的组成部分
* 代表更新的数据结构 -- update
* 消费update的数据结构 -- UpdateQueue

接下来的工作包括：
* 实现mount时调用的API
* 将该API接入上述更新机制中

需要考虑的事情：
* 更新可能发生于任意组件， 而更新流程是从根节点递归的
* 需要一个同意的根节点保存通用信息 


## 五.初探mount流程
更新流程的目的：
* 生成wip fiberNode树
* 标记副作用flags

更新流程的步骤：
* 递： beginWork
* 归： completeWork

### beginWork
```
<A>
  <B/>
</A>
```
当进入A的beginWork时， 通过对比B current fiberNode 与 B reactElement, 生成B对应的wip fiberNode,
在此过程中最多会标记2类与 结构变化 相关的 flags
* Placement
* ChildDeletion


### 实现与Host相关节点的beginWork
为开发环境增加__DEV__标识
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
* 两年半 Placement
* span  Placement
* 练习时长  Placement
* p  Placement
* div Placement

相比较与执行5次 Placement, 我们可以构建好 离屏DOM树 后， 对 div 执行1次 Placement

**注意**
上述mount时， 如果不给每个要更新的ReactElement打上 Placement 标记， 那么是不是没有节点有 Placement 标记， 那么是不是无法创建更新呢？
其实在首屏渲染时， 为一个有 workInProgress 的节点是 HostRootNode, 那么这个FiberNode其实会进入 update流程， 也就是会打上 Placement 标记

### completeWork
* 对于Host类型的fiberNode, 构建离屏DOM树
* 标记Update Flag

#### completeWork性能优化策略
flags分布在不同fiberNode中， 如何快速找到他们？
答案： 利用completeWork向上遍历(归)的流程， 将子fiberNode的flags冒泡到父fiberNode

## 六. 初探ReactDom
react内部三个阶段
* schedule阶段
* render阶段（beginWork completeWork）
* commit阶段（commitWork）

### Commit阶段的三个子阶段
* beforeMutation阶段
* mutation阶段
* layout阶段

### 当前commit阶段要执行的任务
* fiber树的切换
* 执行Placement对应操作

### 打包ReactDOM
* 兼容原版React的导出
* 处理HostConfig的指向
  * tsconfig.js 修改
  * 类似 webpack resolve alias的功能， 在rollup中使用

## 八 实现useState
hook脱离FC上下文， 仅仅是普通函数， 如何让他拥有感知上下文环境的能力

比如说：
* hook如何知道在另一个hook的上下文环境内执行
```js
function App() {
  useEffect(() => {
    // 执行useState时怎么知道处在 useEffect 上下文
    useState(0)
  })
}
```

* hook怎么知道当前是mount还是update?
  * 解决方案： 在不同上下文中调用的hook不是同一个函数


实现 内部数据共享层 时的注意事项：
以浏览器为例， Reconciler + hostConfig = ReactDOM


增加 内部数据共享层， 意味着Reconciler与React产生关联， 进而意味着ReactDOM与React产生关联

如果两个包产生关联， 在打包时需要考虑： 两者的代码是打包在一起还是分开？

如果打包在一起， 意味着打包后的ReactDOM中会包含React的代码， 那么ReactDOM中会包含一个内部数据共享层， React中也会包含一个内部数据共享层， 这两者不是同一个内部数据共享层。

而我们希望两者共享数据， 所以不希望ReactDOM中会包含React的代码



* hook如何知道自身数据保存在哪
  * 答案： 可以记录在当前正在render的FC对应的fiberNode， 在fiberNode中保存hook数据


## 实现Test Utils测试工具
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