const github = require("@actions/github")
const { GH_TOKEN } = require('../input')

class GithubConnector {
  constructor() {
    this.octokit = new github.getOctokit(GH_TOKEN)
  }

  async updatePR(title, body) {
    const data = {
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      pull_number: github.context.payload.pull_request.number,
    }

    if (title) {
      data['title'] = title
    }
    if (body) {
      data['body'] = body
    }

    return this.octokit.rest.pulls.update(data)
  }
}

module.exports = GithubConnector
