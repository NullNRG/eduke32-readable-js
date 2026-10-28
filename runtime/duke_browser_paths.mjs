/** Platform-only replacement for original Duke G_AddSearchPaths desktop discovery.
 * Desktop Steam, GOG and /usr paths have no browser equivalent. Instead the
 * caller's verified application-root VFS is registered with the *same* Build
 * search-path API. Game resource loading remains original-source behavior.
 */
export function createDukeBrowserPaths({ fs, addsearchpath_user, applicationDirectory='/' }={}) {
  if (!fs?.searchPaths || typeof addsearchpath_user !== 'function')
    throw new TypeError('Original Build VFS/search-path implementation required');
  const encoder=new TextEncoder();
  function G_AddSearchPaths() {
    // G_ExtPreInit registers the save/config search path. Browser-distributed
    // GRP/CON/ART assets are mounted inside applicationDirectory, not in Steam.
    const root=applicationDirectory.replace(/\/+$/,'') || '/';
    const normalized=root.replace(/^\/+/, '').replace(/\/+$/, '');
    if (fs.searchPaths.some(x=>x.prefix===normalized)) return;
    const result=addsearchpath_user(encoder.encode(root+'\0'),0);
    if (result!==0)throw new Error(`Browser application search root rejected (${result}): ${root}`);
  }
  return Object.freeze({G_AddSearchPaths});
}
