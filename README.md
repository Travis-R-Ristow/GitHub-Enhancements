<div align="center">

# ✨ GitHub Enhancements

**A Chrome extension that makes GitHub actually enjoyable to use.**

![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-No_Build-F7DF1E?logo=javascript&logoColor=black)
![Version](https://img.shields.io/badge/version-0.1.0-blue)

</div>

---

## 🔍 Pull Requests & Issues

| Feature                  | What it does                                                          |
| ------------------------ | --------------------------------------------------------------------- |
| **Author Filter**        | Dropdown to filter comments by participant — pick who you want to see |
| **Text Search**          | Search through comment bodies in real time                            |
| **Collapse Description** | Tuck away long PR descriptions with one click                         |
| **Floating Nav**         | Scroll-to-top / scroll-to-bottom buttons that stay out of your way    |

## 🔎 Search

| Feature                       | What it does                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| **Code Search Toggle**        | One click to force code search for the session                                        |
| **Custom Search Buttons**     | Save reusable query fragments (`org:my-org`, `language:python`) as toggleable buttons |
| **Export / Import**           | Share your button configs as JSON                                                     |
| **Search Limits Cheat Sheet** | Built-in reference for GitHub's search constraints                                    |

## 🚀 Development Setup

```
1. Clone this repo
2. Go to chrome://extensions
3. Enable Developer mode
4. Click "Load unpacked" → select the repo folder
5. Head to github.com and click "Enhance" in the header
```

No build step — edit the source files and reload the extension to see changes.

## 🔒 Permissions

| Permission   | Why                                |
| ------------ | ---------------------------------- |
| `activeTab`  | Access the current GitHub tab      |
| `storage`    | Remember your settings             |
| `scripting`  | Inject enhancements into GitHub    |
| `github.com` | Only runs on GitHub — nothing else |

## 🛠️ Built With

Chrome Manifest V3 · Vanilla JS · No frameworks · No build step
