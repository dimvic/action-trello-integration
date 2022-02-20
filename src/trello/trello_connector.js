const { format } = require('url')
const fetch = require('node-fetch')

const {
  TRELLO_TOKEN,
  TRELLO_API_KEY,
} = require('../input')

const TRELLO_API_URL = 'https://api.trello.com/1'

module.exports = class JiraConnector {
  async getCard(cardCode) {
    return this.fetch(`/card/${cardCode}`)
  }

  async getCardAttachments(cardCode) {
    return this.fetch(`/card/${cardCode}/attachments`)
  }

  async getCardChecklists(cardCode) {
    return this.fetch(`/card/${cardCode}/checklists`)
  }

  async addCardAttachment(cardCode, url) {
    return this.fetch(`/card/${cardCode}/attachments`, { url }, 'POST')
  }

  async client(state) {
    const response = await fetch(state.req.url, state.req)

    state.res = {
      headers: response.headers.raw(),
      status: response.status,
      body: await response.text()
    }

    if (state.res.body && (response.headers.get('content-type') || '').includes('application/json')) {
      state.res.body = JSON.parse(state.res.body)
    }

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    return state
  }

  async fetch(pathname, query, method) {
    query ||= {}
    query['key'] = TRELLO_API_KEY
    query['token'] = TRELLO_TOKEN
    const url = format({ host: TRELLO_API_URL, pathname, query })

    method ||= 'GET'

    const state = {
      req: {
        method,
        url,
      },
    }

    try {
      await this.client(state)
    } catch (error) {
      delete state.req.headers

      throw Object.assign(new Error('Jira API error'), state, { originalError: error })
    }

    return state.res.body
  }
}

