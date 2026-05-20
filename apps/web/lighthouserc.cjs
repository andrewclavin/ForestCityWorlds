/** @type {import('lighthouse').Flags} */
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: ["http://127.0.0.1:3000/", "http://127.0.0.1:3000/about"],
      settings: { preset: "desktop" },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.85 }],
        "categories:seo": ["error", { minScore: 0.85 }],
        "categories:performance": ["warn", { minScore: 0.55 }],
      },
    },
  },
};
