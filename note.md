
项目初始化
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

