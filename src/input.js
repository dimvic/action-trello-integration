const core = require("@actions/core")

module.exports = {
  GH_TOKEN: core.getInput('github-token', { required: true }),
  TRELLO_API_KEY: core.getInput('trello-api-key', { required: true }),
  TRELLO_TOKEN: core.getInput('trello-token', { required: true }),
  TRELLO_BOARD_ID: core.getInput('trello-board-id', { required: true }),

  PR_ENFORCE_CARD_EXISTS: core.getInput('pr-enforce-card-exists', { required: false }),
  PR_UPDATE_TITLE: core.getInput('pr-update-title', { required: false }) !== 'false',
  PR_UPDATE_DESCRIPTION: core.getInput('pr-update-description', { required: false }) !== 'false',
  PR_CARD_CODE_REGEXP: core.getInput('pr-card-code-regexp', { required: false }),
  PR_SKIP_BASE_REF_REGEXP: core.getInput('pr-skip-base-ref-regexp', { required: false }),
  PR_SKIP_HEAD_REF_REGEXP: core.getInput('pr-skip-head-ref-regexp', { required: false }),
  PR_SKIP_USER_REGEXP: core.getInput('pr-skip-user-regexp', { required: false }),
}
