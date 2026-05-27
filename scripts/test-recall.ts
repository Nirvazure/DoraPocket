import 'dotenv/config'

import { recallToolMatchesFromCatalog } from '../src/server/retrieval/tool-recall'

const result = await recallToolMatchesFromCatalog('帮我把照片背景去掉', {
  builtinToolsEnabled: false,
})

console.log(
  JSON.stringify(
    {
      recallSummary: result.recallSummary,
      topMatches: result.matches.slice(0, 3).map((m) => m.tool.name),
    },
    null,
    2,
  ),
)
