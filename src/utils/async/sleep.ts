export function sleep(num: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, num);
    })
}

export function randomSleep(t: number): Promise<void> {
    const max = 400;
    const min = 200;
    t = t || Math.floor(Math.random() * (max - min + 1)) + min;
    return sleep(t)
}
