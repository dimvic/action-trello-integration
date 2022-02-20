const util = require('util')
const github = require("@actions/github");

const HIDDEN_MARKER_START = '<!--action-trello-integration-start-->'
const HIDDEN_MARKER_END = '<!--action-trello-integration-end-->'
const WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS = '<!--do not remove this marker, needed for action-trello-integration-->'

const escapeRegexp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getPrTitle = (card) => {
  return `[${card.shortLink}] ${card.name}`
}

const getPrDescription = (oldBody, trelloCard, trelloCardAttachments, trelloCardChecklists) => {
  const addonDescription = buildPrDescription(trelloCard, trelloCardAttachments, trelloCardChecklists);
  const hiddenMarkerStartRg = escapeRegexp(HIDDEN_MARKER_START)
  const hiddenMarkerEndRg = escapeRegexp(HIDDEN_MARKER_END)

  const rg = new RegExp(`${hiddenMarkerStartRg}([\\s\\S]+)${hiddenMarkerEndRg}`, 'iugm')
  const bodyWithoutTrelloDescription = (oldBody ?? '').replace(rg, '')

  return `
${bodyWithoutTrelloDescription.trim()}

${HIDDEN_MARKER_START}
${WARNING_MESSAGE_ABOUT_HIDDEN_MARKERS}
---
${addonDescription}
${HIDDEN_MARKER_END}
`.trim()
}

const buildPrDescription = (card, trelloCardAttachments, trelloCardChecklists) => {
  return `
<table>
<tr>
  <td>
    <a href="${card.shortUrl}" title="${card.shortLink}" target="_blank">
      [${card.shortLink}] ${card.name}
    </a>
  </td>
</tr>
</table>

${card.desc}

${buildAttachmentsMarkdown(trelloCardAttachments)}

${buildChecklistsMarkdown(trelloCardChecklists)}
`.trim()
}

const buildChecklistsMarkdown = (trelloCardChecklists) => {
  const checklists = trelloCardChecklists.map(checklist => {
    let markdown = `### ${checklist.name}\n\n`

    if (checklist.checkItems) {
      markdown += checklist.checkItems.map(checkItem => {
        if (checkItem.state === 'incomplete') {
          return checkItem.name
        }

        return `~~${checkItem.name}~~`
      }).join("\n")
    }

    return markdown.trim()
  }).join("\n\n")

  if (checklists) {
    return `## Checklists\n\n${checklists}`
  }

  return null
}

const buildAttachmentsMarkdown = (trelloCardAttachments) => {
  const pull_request = github.context.payload.pull_request
  const attachments = trelloCardAttachments
    .filter(attachment => {
      return attachment.url !== pull_request.html_url
    })
    .map(attachment => {
      return `[${attachment.name}](${attachment.url})`
    })
    .join("\n")

  if (attachments) {
    return `## Attachments\n\n${attachments}`
  }

  return null
}

module.exports = {
  inspect: o => util.inspect(o, { showHidden: false, depth: null }),
  escapeRegexp,
  getPrTitle,
  getPrDescription,
}
