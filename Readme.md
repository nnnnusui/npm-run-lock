# npm-run-lock

`npm run xxxxx`の重複した実行を防ぐコマンドを追加します。
Addition of command to suppress multiple launch of npm script.

## Usage

### syntax

```
lock {...commandAndArguments}
```

### example

```json:package.json
{
  "scripts": {
    "exec": "lock tsc -w",
    ...
  },
  ...
}
```

### Recommendation

```.gitignore
.lock
```
