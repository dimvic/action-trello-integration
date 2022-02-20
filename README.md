# Trello integration GitHub Action

Include a Trello card code in your PR title to:

- Change Pull Request title to be the same as the Trello card title
- Append Trello card description to Pull Request description
- Attach Pull Request to Trello card (the GitHub Power Up gives some pretty nice extra insights)

All features are opt in/out using options. It is possible to return with success even when a Trello card ID is not found
in the Pull Request's title, exclude specific branches (base or head to the PR) or specific users (PR authors).

For more information on options see [action.yml](./action.yml)

```yml
name: Trello integration
on:
  pull_request:
    types: [ opened, edited, synchronize, reopened ]

jobs:

  trello_integration:
    name: Trello integration
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v1
      - name: Trello bureaucracy
        uses: dimvic/action-trello-integration@v1
        with:
          github-token: ${{ secrets.GH_TOKEN }}
          trello-api-key: ${{ secrets.TRELLO_API_KEY }}
          trello-token: ${{ secrets.TRELLO_TOKEN }}
          trello-board-id: 'cq7E1aNE'
          pr-enforce-card-exists: 'true'
          pr-update-title: 'true'
          pr-update-description: 'true'
          pr-card-code-regexp: '^\[(\w+)\]'
          pr-skip-base-ref-regexp: '^deploy/'
          pr-skip-head-ref-regexp: ''
          pr-skip-user-regexp: '^dimvic$'
```
