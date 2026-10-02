// Conventional Commits (see AGENTS.md → Git workflow). Enforced by the lefthook `commit-msg` hook and CI.
const coAuthorTrailer = /^co-authored-by:/im;

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        // Built-in `trailer-exists` is case-sensitive; Git and GitHub accept any casing.
        "no-co-author-trailer": ({ raw }) => [
          !coAuthorTrailer.test(raw ?? ""),
          "Co-Authored-By trailers are not allowed (AGENTS.md → Git workflow)",
        ],
      },
    },
  ],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "docs",
        "test",
        "refactor",
        "perf",
        "build",
        "ci",
        "revert",
        "style",
      ],
    ],
    "no-co-author-trailer": [2, "always"],
    // Long URLs and file paths are common in bodies/footers; flag, do not block.
    "body-max-line-length": [1, "always", 100],
    "footer-max-line-length": [1, "always", 100],
  },
};
