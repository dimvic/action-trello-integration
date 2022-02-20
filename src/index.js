const core = require('@actions/core')
const github = require('@actions/github')
const { get, isArray } = require('lodash')

const TrelloConnector = require('./trello/trello_connector')
const GithubConnector = require('./github/github_connector')

const {
  TRELLO_BOARD_ID,
  PR_ENFORCE_CARD_EXISTS,
  PR_UPDATE_TITLE,
  PR_UPDATE_DESCRIPTION,
  PR_CARD_CODE_REGEXP,
  PR_SKIP_BASE_REF_REGEXP,
  PR_SKIP_HEAD_REF_REGEXP,
  PR_SKIP_USER_REGEXP,
} = require('./input')

const {
  inspect,
  getPrTitle,
  getPrDescription,
} = require('./utils')


const VALID_EVENTS = ['pull_request']

async function run() {
  const eventName = github.context.eventName
  if (VALID_EVENTS.indexOf(eventName) < 0) {
    core.setFailed(`Invalid event: ${eventName}`)
    return
  }

  const pull_request = github.context.payload.pull_request
  const title = pull_request.title

  core.info(`Pull Request title: ${title}`)

  /*
   * skip if PR base ref matches regexp
   */
  if (PR_SKIP_BASE_REF_REGEXP && pull_request.base.ref.match(new RegExp(PR_SKIP_BASE_REF_REGEXP))) {
    core.info('Skipping because PR base ref matches regexp')
    core.info(`Base: ${pull_request.base.ref}`)
    core.info(`Base skip regexp: ${pull_request.base.ref}`)
    return
  }

  /*
   * skip if PR head ref matches regexp
   */
  if (PR_SKIP_HEAD_REF_REGEXP && pull_request.head.ref.match(new RegExp(PR_SKIP_HEAD_REF_REGEXP))) {
    core.info('Skipping because PR head ref matches regexp')
    core.info(`Head: ${pull_request.head.ref}`)
    core.info(`Head skip regexp: ${PR_SKIP_HEAD_REF_REGEXP}`)
    return
  }

  /*
   * skip it if PR author matches regexp
   */
  if (PR_SKIP_USER_REGEXP && pull_request.user.login.match(new RegExp(PR_SKIP_USER_REGEXP))) {
    core.info('Skipping because PR author matches regexp')
    core.info(`Author: ${pull_request.user.login}`)
    core.info(`Author skip regexp: ${PR_SKIP_USER_REGEXP}`)
    return
  }

  // core.info(inspect(github.getOctokit(GH_TOKEN)))

  // Get Trello card code
  const cardCodeMatches = title.match(new RegExp(PR_CARD_CODE_REGEXP)) || []
  const cardCode = (get(cardCodeMatches, cardCodeMatches.length - 1) || '').toString()

  /*
   * Check card code
   */
  if (!cardCode) {
    if (PR_ENFORCE_CARD_EXISTS) {
      core.setFailed('Could not read an card code from PR title.')
    } else {
      core.info('Could not read an card code from PR title.')
    }
    core.info(`Issue code regexp: ${PR_CARD_CODE_REGEXP} -- ${PR_ENFORCE_CARD_EXISTS ? 'enforce' : 'dont enforce'}`)
    return
  }

  core.info(`Recognized Issue Code: ${cardCode}`)


  /*
   * Get Trello card
   */
  if (!(PR_ENFORCE_CARD_EXISTS || PR_UPDATE_TITLE || PR_UPDATE_DESCRIPTION)) {
    return
  }

  const trelloConnector = new TrelloConnector
  let trelloCard

  try {
    trelloCard = await trelloConnector.getCard(cardCode)
  } catch (e) {
    if (PR_ENFORCE_CARD_EXISTS) {
      core.setFailed('Trello card lookup raised an error')
    } else {
      core.info('Trello card lookup raised an error')
    }
    core.info(inspect(e))
    return
  }

  if (!trelloCard) {
    return
  }

  if (TRELLO_BOARD_ID && trelloCard.idBoard !== TRELLO_BOARD_ID) {
    core.setFailed(`Trello card board ID not the same as provided "trello-board-id"`)
    return
  }

  // Get Trello card attachments
  const trelloCardAttachments = await trelloConnector.getCardAttachments(cardCode)
  // Get Trello card checklists
  const trelloCardChecklists = await trelloConnector.getCardChecklists(cardCode)

  /*
   * Update GitHub PR title and description
   */
  let prTitle = null
  let prDescription = null

  if (PR_UPDATE_TITLE) {
    prTitle = getPrTitle(trelloCard, title)
  }
  if (PR_UPDATE_DESCRIPTION) {
    prDescription = getPrDescription(pull_request.body, trelloCard, trelloCardAttachments, trelloCardChecklists)
  }

  if (PR_UPDATE_TITLE || PR_UPDATE_DESCRIPTION) {
    const updatingProperties = [
      prTitle ? 'title' : null,
      prDescription ? 'description' : null
    ].filter(v => !!v).join(' and ')

    core.info(`Updating PR ${updatingProperties}`)

    const githubConnector = new GithubConnector
    await githubConnector.updatePR(prTitle, prDescription)
  }

  /*
   * Attach PR to Trello card
   */
  if (isArray(trelloCardAttachments) && !trelloCardAttachments.filter(a => a.url === pull_request.html_url).length) {
    await trelloConnector.addCardAttachment(cardCode, pull_request.html_url)
  }
}

run()
