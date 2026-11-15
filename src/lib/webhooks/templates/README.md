# Webhook templates

`discord/<ACTIVITY_TYPE>.json` is the [embed](https://discord.com/developers/docs/resources/message#embed-object) for that type, `children.json` the line a linked activity adds to `{{{children}}}`, and `message.json` the message around the embeds.

- `{{value}}` escapes Discord markdown, `{{{value}}}` doesn't. Use `{{ }}` for anything users write.
- A line or field with an empty value is left out.
- Keep `"allowed_mentions": { "parse": [] }` in `message.json`, so `@everyone` in a title can't ping.

The values are built in `toView` in `../discord.js`.
