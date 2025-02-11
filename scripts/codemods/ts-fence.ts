// @ts-ignore
import type cs from "jscodeshift";

const EXAMPLE = "* @example\n";
const EXAMPLE_WITH_FENCE = "* @example\n * ```ts\n";

export default function transformer(file: cs.FileInfo, api: cs.API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  root.find(j.Comment as any).forEach((path) => {
    if (path.value.type === "CommentBlock") {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const value = path.value as any;
      const comment = value.value;
      if (comment.includes(EXAMPLE) && !comment.includes(EXAMPLE_WITH_FENCE)) {
        value.value = wrapExamplesWithFence(comment);
      }
    }
  });

  return root.toSource();
}

function wrapExamplesWithFence(jsdocComment: string) {
  const start = jsdocComment.indexOf(EXAMPLE) + EXAMPLE.length;
  let end = jsdocComment.indexOf(" * @", start);
  if (end === -1) {
    end = jsdocComment.length - 1;
  } else {
    if (jsdocComment.substring(end - 3, end) === " *\n") {
      end -= 3;
    }
  }
  return `${jsdocComment.substring(0, start)} * \`\`\`ts\n${jsdocComment.substring(start, end)} * \`\`\`\n${jsdocComment.substring(end)}`;
}
