export interface IBookmarkFolder {
  id: string | undefined // undef for root folder
  title?: string
}

export async function getFullPath(bmId: string | undefined): Promise<IBookmarkFolder[]> {
  if (!bmId)
    return []
  const currentNode = await browser.bookmarks.get(bmId)
  return (await getFullPath(currentNode[0].parentId)).concat({
    id: currentNode[0].id,
    title: currentNode[0].title,
  })
}
