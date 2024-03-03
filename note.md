
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