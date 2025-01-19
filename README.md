# Ranking Engine

A simple ranking engine built with SvelteKit and Tailwind CSS.

## Features

- Create a list of items
- Compare items to rank them
- Insert new items at a specific position
- Delete items

## Why

I love prioritizing items in a list. I wanted to create a simple ranking engine that I could use in my projects.
Inspired by [Pubmeeple's ranking engine](https://www.pubmeeple.com/ranking-engine). With extra features:

- Insert new items after sorting

Optimized to reduce comparisons done by the user through:

- using merge sort to sort the items
- building a DAG (directed acyclic graph) of comparisons

## Demo

[Demo](https://ranking-engine.pages.dev/)

## How to use

1. Clone the repository
2. Run `pnpm install`
3. Run `pnpm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## License

[MIT](LICENSE)
