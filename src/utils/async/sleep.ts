export function sleep(num: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, num);
  });
}

export function randomSleep(
  max: number = 400,
  min: number = 200
): Promise<void> {
  return sleep(randomNum(max, min));
}

function randomNum(max: number, min: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
