<div align="center">

# GitHub Enhancements

**A Chrome extension that makes GitHub actually enjoyable to use.**

![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-No_Build-F7DF1E?logo=javascript&logoColor=black)
![Version](https://img.shields.io/badge/version-0.1.4-blue)

</div>

---

## Install

**<a href="https://chromewebstore.google.com/detail/github-enhancements/fdjpimclonmcgamgpkijgnkeclkpipdb" target="_blank">Get it from the Chrome Web Store</a>**

1. Click the link above and hit **Add to Chrome**
2. Navigate to any page on `github.com`
3. Click **Enhance** in the top bar to activate

All features are off by default. Toggle them on with the Enhance button that appears at the top of every GitHub page. Your settings sync across tabs automatically.

---

## Features

### Enhance Toggle

A persistent top navbar appears on every GitHub page. The **Enhance** button activates all enhancements — click it once and everything below turns on. A sparkle burst confirms activation. Click again to turn everything off and restore GitHub to its default state.

### Custom Navbar Buttons

Add your own links to the top navbar for quick access to any URL. Click **Add Buttons** in the top bar to open the management modal where you can:

- Create buttons with a label and URL
- Choose how each link opens: **In Tab**, **New Tab**, or **New Window**
- Edit any button's label, URL, or open mode inline
- Drag and drop to reorder buttons
- Delete buttons you no longer need

URLs support tokens resolved from the current page: `{repo}` and `{prNumber}`. Tokens work with any scheme, including custom deep links. A button automatically disables itself on pages where its tokens can't be resolved (for example, a `{prNumber}` button is greyed out when you're not on a pull request).

### Pull Request & Issue Enhancements

#### Comment Author Filter

A filter bar appears above the PR conversation timeline. Use the **author dropdown** to select one or more participants — only their comments remain visible. Selected authors appear as removable pills above the timeline. Works on both PRs and issues.

#### Comment Text Search

A search input sits next to the author filter. Type any text to filter the conversation in real time — only comments containing your search term stay visible. Combine with the author filter for precise results.

#### Reverse Chronological Order

Comments on the **Conversation** tab and the **Commits** tab are automatically reordered newest-first so you see the latest activity without scrolling to the bottom. The original order restores when you toggle Enhance off.

#### Description Collapse

A chevron button appears in the top-right corner of the PR description. Click it to collapse the description body — useful for long template-heavy descriptions that push the conversation off screen. The description also auto-collapses when filters are active.

#### Side Panel Author Filter (Changes Tab)

On the **Changes** tab, the native "Additional comment filters" button is replaced with the same author dropdown used on the Conversation tab. Filter the side panel review comments by author. Your selection persists as the panel re-renders during navigation.

#### Auto Conversation View (Changes Tab)

When you open the **Changes** tab, the comment view mode automatically switches to **Conversation** if it isn't already selected.

#### Diff Hash Navigation (Changes Tab)

Clicking a link that targets a specific diff or line (e.g. `#diff-abc123R42`) will expand the file if it's collapsed, smooth-scroll to the target, and briefly highlight it so you don't lose your place.

#### Floating Scroll Buttons

**Scroll to Top** and **Scroll to Bottom** buttons float on the right side of PRs and issues. If your cursor hovers over one for 5 seconds it hides for 12 seconds to get out of your way, then reappears automatically.

### Search Enhancements

#### Custom Search Buttons

Save reusable query fragments as toggleable toolbar buttons on the GitHub search page. Each button appends or removes its fragment from the current query.

- Open the **Add / Manage** modal to create, edit, and delete buttons
- Use the **prefix chips** (`repo:`, `org:`, `language:`, etc.) to quickly insert common qualifiers
- The fragment input shows a **syntax-highlighted preview** of your query tokens
- **Auto-search** (on by default) immediately runs the query when you toggle a button — turn it off for buttons you want to compose before searching
- **Export / Import** your button configs as JSON to share across machines

#### Force Code Search

A **Code Search** toggle on the search toolbar forces all searches in the current tab to use `type=code`. Stays active for the browser session. Automatically deactivates if you manually switch to a different search type.

#### Search Limits Reference

A collapsible **Search Limits** section in the manage modal lists GitHub's hard search constraints (1,000 result cap, file size limits, fork behavior, etc.) with a link to the official docs.

### Repo Navigation

#### Releases Tab

A **Releases** tab with a tag icon is injected into the repository navigation bar, placed after the Actions tab. It links to the repo's releases page and highlights when you're viewing releases.

### Popup

Click the extension icon in the Chrome toolbar to open the popup with three tabs:

- **Main** — toggle Enhance on/off with a sparkle animation
- **Storage** — **Export** all extension data as JSON, **Import** a backup, or **Hard Delete** everything (with confirmation)
- **About** — privacy note: no data collected, no API, no database, everything stays in your browser

### Privacy

No data is collected. GitHub Enhancements has no API, no database, and no analytics. Everything stays in `chrome.storage.local` in your browser.
