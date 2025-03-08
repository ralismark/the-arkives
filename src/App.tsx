import './App.css';
import { Fragment, useState } from 'react';
import { CategoryId, ChannelId, ChannelMeta, GuildId, GuildMeta, Index, MessageId, Path } from './datatypes';
import { useFetch } from './kitchen-sink';
import { ChannelPage } from './Channel';

const baseurl = (() => {
  const url = new URL(location.toString());
  url.search = "";
  url.hash = "";
  return url.toString();
})();


declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

type IndexCategory = {
  name: string,
  contained: Map<ChannelId, IndexThread>,
}

type IndexThread = {
  name: string,
  export: ([Path, Index[Path]] | null)[],
}

type IndexChannel = IndexCategory & IndexThread;

function entriesSorted<T>(map: Map<string, T>): [string, T][] {
  return [...map.entries()].sort(([a], [b]) => +a - +b);
}

function IndexListing() {
  const index = useFetch<Index>("/index.json");

  // e.g. https://discord.com/channels/692945454601601095/1206817947675402280/1229332496613773348
  const m = location.search.match(/^\?https:\/\/discord.com\/channels\/(\d+)\/(\d+)\/(\d+)/)
  if (m) {
    const [_, guild, channel, msg] = m;
    for (const [path, meta] of Object.entries(index)) {
      if (
        meta.guild.id == guild &&
        meta.channel.id == channel &&
        meta.first_message_id <= msg &&
        meta.last_message_id >= msg
      ) {
        // set query parameter to path and hash to msg
        const url = new URL(location.href);
        url.hash = "#" + msg;
        url.search = "?" + path;

        // don't keep current url in browser history
        location.replace(url);
      }
    }
  }

  const categories = new Map<CategoryId, IndexCategory>();
  const channels = new Map<ChannelId | CategoryId, IndexChannel>();

  // create null category for channels without category
  const nullCategory: IndexCategory = {
    name: "",
    contained: new Map()
  }
  categories.set("" as CategoryId, nullCategory)

  // collate all channel
  for (const [path, entry] of Object.entries(index)) {
    if (entry.channel.type === "GuildPublicThread") continue;

    // create category if not exists
    let category = categories.get(entry.channel.categoryId);
    if (!category) {
      category = {
        name: entry.channel.category,
        contained: new Map(),
      }
      categories.set(entry.channel.categoryId, category);
    }

    // create channel if not exists
    let channel = channels.get(entry.channel.id);
    if (!channel) {
      channel = {
        name: entry.channel.name,
        contained: new Map(),
        export: [],
      }
      channels.set(entry.channel.id, channel);
      category.contained.set(entry.channel.id, channel);
    }

    // add part
    const m = path.match(/( \[part (\d+)\])?\.json$/);
    const part = m && m[2] ? +m[2] : 1;

    channel.export.length = Math.max(channel.export.length, part);
    channel.export[part - 1] = [path as Path, entry];
  }

  // collate all threads
  for (const [path, entry] of Object.entries(index)) {
    if (entry.channel.type !== "GuildPublicThread") continue;

    // get parent channel
    let channel = channels.get(entry.channel.categoryId);
    if (!channel) {
      // parent channel doesn't exist for e.g. forums
      channel = {
        name: entry.channel.category,
        contained: new Map(),
        export: [],
      }

      console.log("parent:", entry.channel.categoryId)
      channels.set(entry.channel.categoryId, channel);
      nullCategory.contained.set(entry.channel.id, channel);
    }

    // create thread if not exists
    let thread = channel.contained.get(entry.channel.id);
    if (!thread) {
      thread = {
        name: entry.channel.name,
        export: [],
      }
      channel.contained.set(entry.channel.id, thread);
    }

    // add part
    const m = path.match(/( \[part (\d+)\])?\.json$/);
    const part = m && m[2] ? +m[2] - 1 : 0;

    while (thread.export.length < part) thread.export.push(null);
    thread.export[part] = [path as Path, entry];
  }

  function Label(props: { name: string, parts: ([Path, Index[Path]] | null)[] }) {
    if (props.parts.length === 0) {
      return <>{props.name}</>
    } else if (props.parts.length === 1) {
      return <a href={"?" + encodeURIComponent(props.parts[0]![0])}>{props.name}</a>
    } else {
      return <>
        {props.name}
        <span className="parts">
          {props.parts.map((part, i) => {
            return <a
              key={i}
              href={part ? "?" + encodeURIComponent(part[0]) : undefined}
            >{i + 1}</a>
          })}
        </span>
      </>
    }
  }

  console.log(categories);

  return <main id="listing">
    {entriesSorted(categories).map(([categoryId, category]) => <Fragment key={categoryId}>
      {category.name && <h2>{category.name}</h2>}
      {entriesSorted(category.contained).map(([channelId, channel]) => <Fragment key={channelId}>
        <h3>
          <Label name={channel.name} parts={channel.export} />
        </h3>
        {(channel as IndexChannel).contained.size > 0 && <ul>
          {entriesSorted((channel as IndexChannel).contained).map(([threadId, thread]) => <li key={threadId}>
            <Label name={thread.name} parts={thread.export} />
          </li>)}
        </ul>}
      </Fragment>)}
    </Fragment>)}
  </main>
}

function IndexPage() {
  const [url, setUrl] = useState("https://discord.com/channels/692945454601601095/1206818470008983653/1234686008088461454");

  return <>
    <h1>✨ The ARKives ✨</h1>

    <section className="paper">
      <p>
        You can jump to a Discord link by adding ? to the URL and appending it:
      </p>

      <form id="quickjump" onSubmit={e => {
        e.preventDefault();
        location.href = "?" + encodeURI(url);
      }}>
        <strong>{baseurl}?</strong>
        <input type="text" value={url} onChange={e => setUrl(e.target.value)} />
        <br />
        <button type="submit">Go</button>
      </form>

      {/* terrible hack to do margins but i cbf */}
      <p></p>
    </section>

    <br style={{ marginTop: "2em" }} />

    <IndexListing />

    <br style={{ marginTop: "2em" }} />

    <section className="paper">
      <p>
        Hi!

        This website was made by Viv (@lycheeleaves)!
        I'd love to hear what you have to say about this ^.^
      </p>
      <p>
        Much thanks to @queze for creating the export, without your work this would not even exist.
      </p>
      <p>
        This project also borrows a lot of code from <a href="https://github.com/slatinsky/DiscordChatExporter-frontend/">slatinsky's DiscordChatExporter-frontend</a>, in particular for parsing and rendering messages :)
      </p>
    </section>

  </>
}

function App() {
  if (!location.search || location.search.startsWith("?https://")) {
    return <IndexPage />;
  } else {
    return <ChannelPage url={decodeURIComponent(location.search.substring(1))} />;
  }
}

export default App;
