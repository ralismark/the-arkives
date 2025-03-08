import './Channel.css';
import { Attachment, ChannelMeta, Export, GuildMeta, Index, Message, NullChannelMeta, NullGuildMeta } from './datatypes';
import { JumpToHash, useFetch, useFetchEager } from './kitchen-sink';
import { createContext, Suspense, useContext, useMemo } from 'react';
import { parseMarkdown } from './markdown';

type ChannelContextType = {
  meta: ChannelMeta,
  guild: GuildMeta,
}
const ChannelContext = createContext<ChannelContextType>({
  meta: NullChannelMeta,
  guild: NullGuildMeta,
});

/* full list of extensions:
docx
jpg%3Alarge
json
mov
mp3
mp4
ogg
pdf
txt
*/

const imageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".pnj",
  ".gif",
  ".webp",
  ".svg",
]

const videoExtensions = [
  ".mp4",
  ".mov",
]

function Attached(props: { attachment: Attachment }) {
  const url = props.attachment.url;
  const name = props.attachment.fileName;

  if (imageExtensions.some(ext => name.toLowerCase().endsWith(ext))) {
    return <div className="attachment">
      <a href={"export/" + url}>{name}</a>
      <img src={"export/" + url} />
    </div>
  } else {
    return <div className="attachment">
      <a href={"export/" + url}>{name}</a>
    </div>
  }
}

function Msg(props: { message: Message }) {
  const channel = useContext(ChannelContext);

  const rendered = parseMarkdown(props.message.content, {
    onlyOffline: false,
    users: {},
    roles: [],
    channels: [],

    ...props.message,
  })

  const date = new Date(props.message.timestamp);

  return <article className="Msg" id={props.message.id}>
    <header
      style={{
        "--color": props.message.author.color,
      }}
    >
      <span className="username">{props.message.author.nickname}</span>
      <a href={`?https://discord.com/channels/${channel.guild.id}/${channel.meta.id}/${props.message.id}`}>
        <time dateTime={props.message.timestamp}>{date.toLocaleString()}</time>
      </a>
    </header>
    <section className="message-content"
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />

    {props.message.attachments.map(a => <Attached key={a.id} attachment={a} />)}
  </article>
}

// ----------------------------------------------------------------------------

function replacePartNumber(url: string, part: number): string {
  const suffix = part > 1 ? ` [part ${part}].json` : ".json";
  return url.replace(/( \[part \d+\])?\.json$/, suffix);
}

// ChannelPreamble is the header. It is shared between both the loaded and
// unloaded ChannelPages.
function ChannelPreamble(props: {
  url: string,
  channel: ChannelMeta | null,
}) {
  const index = useFetchEager<Index>("/index.json");

  let categoryName = props.channel?.category;
  let channelName = props.channel?.name;
  let part = 1;

  const m = props.url.match(/^(.*?) - (.*?) - (.*?) \[(\d+)\]( \[part (\d+)\])?\.json$/)
  if (m) {
    const [_1, guild, category, channel, channel_id, _2, partStr] = m;

    categoryName ??= category;
    channelName ??= channel;
    if (partStr) part = +partStr
  }

  const partCount = useMemo(() => {
    let partCount = part;

    if (index) {
      // strip [part N] from the end of the URL
      const prefix = props.url.replace(/( \[part \d+\])?\.json$/, "");
      for (const filename in index) {
        if (filename.startsWith(prefix)) {
          const m = filename.match(/ \[part (\d+)\]\.json$/);
          if (m) partCount = Math.max(partCount, +m[1])
        }
      }
    }

    return partCount;
  }, [props.url, index]);

  categoryName ??= "(unknown category)";
  channelName ??= "(unknown channel)";

  const showCategory = props.channel?.type === "GuildPublicThread";

  return <>
    <nav id="navstrip">
      <div>
        <a href="?">The ARKives</a>
        {showCategory && <> / <span>{categoryName}</span></>}
        {" / "}
        <span>{channelName}</span>
      </div>
      <div className="parts">
        {Array.from({ length: partCount }, (_, i) => i + 1).map(i => {
          return <a
            key={i}
            href={"?" + replacePartNumber(props.url, i)}
            className={i == part ? "current-part" : ""}
          >
            {i}
          </a>
        })}
      </div>
      <a
        href="#"
      >Top</a>
    </nav>

    {props.channel && <p className="topic">{props.channel.topic}</p>}
  </>
}

function ChannelPageInner(props: { url: string }) {
  const data = useFetch<Export>("export/" + props.url);

  return <ChannelContext.Provider value={{
    meta: data.channel,
    guild: data.guild,
  }}>
    <ChannelPreamble
      url={props.url}
      channel={data.channel}
    />

    <main id="messages">
      {data.messages.map(message => {
        return <Msg key={message.id} message={message} />
      })}
    </main>

    <JumpToHash />
  </ChannelContext.Provider>
}

export function ChannelPage(props: { url: string }) {
  return <>
    <Suspense fallback={
      <ChannelPreamble url={props.url} channel={null} />
    }>
      <ChannelPageInner url={props.url} />
    </Suspense>
  </>
}
