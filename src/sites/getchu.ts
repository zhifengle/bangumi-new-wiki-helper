export const getchuTools = {
  dealTitle(str: string) : string {
    str = str.trim().split('\n')[0]
    str = str.split('＋')[0].trim();
    return str.replace(/\s[^ ]*?(限定版|通常版|廉価版|復刻版|初回.*?版|描き下ろし).*?$|＜.*＞$/g, '')
  }
}
