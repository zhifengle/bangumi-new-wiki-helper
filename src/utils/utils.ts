export function genRandomStr(len: number): string {
  return Array.apply(null, Array(len))
    .map(function () {
      return (function (chars) {
        return chars.charAt(Math.floor(Math.random() * chars.length));
      })('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
    })
    .join('');
}

export function randomNum(max: number, min: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatDate(time: string | number | Date, fmt: string = 'yyyy-MM-dd'): string {
  const date = new Date(time);
  const components: Record<string, number> = {
    'M+': date.getMonth() + 1, // Month
    'd+': date.getDate(), // Day
    'h+': date.getHours(), // Hour
    'm+': date.getMinutes(), // Minute
    's+': date.getSeconds(), // Second
    'q+': Math.floor((date.getMonth() + 3) / 3), // Quarter
    S: date.getMilliseconds(), // Millisecond
  };

  // Replace year
  fmt = fmt.replace(/(y+)/i, (_, yearMatch) =>
    (date.getFullYear() + '').slice(4 - yearMatch.length)
  );

  // Replace other components
  for (const [key, value] of Object.entries(components)) {
    fmt = fmt.replace(new RegExp(`(${key})`, 'i'), (_, match) =>
      match.length === 1 ? value.toString() : String(value).padStart(match.length, '0')
    );
  }

  return fmt;
}

export function dealDate(input: string): string {
  // Regular expressions to match various date formats
  const regexPatterns = [
    { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日?/, format: '$1-$2-$3' }, // yyyy年mm月dd日
    { pattern: /(\d{4})年(\d{1,2})月/, format: '$1-$2' }, // yyyy年mm月
    { pattern: /(\d{4})[/-](\d{1,2})$/, format: '$1-$2' }, // yyyy/mm
    { pattern: /.*?(\d{4})\/(\d{1,2})\/(\d{1,2}).*?/, format: '$1-$2-$3' }, // mixed with other text
  ];

  for (const { pattern, format } of regexPatterns) {
    const match = input.replace(/\s/g, '').match(pattern);
    if (match) {
      return format.replace(/\$(\d+)/g, (_, number) =>
        String(match[number]).padStart(2, '0')
      );
    }
  }
  // input is not a valid date
  if (isNaN(Date.parse(input))) {
    return input;
  }

  return formatDate(input);
}

export function isEqualDate(d1: string, d2: string): boolean {
  const resultDate = new Date(d1);
  const originDate = new Date(d2);
  if (
    resultDate.getFullYear() === originDate.getFullYear() &&
    resultDate.getMonth() === originDate.getMonth() &&
    resultDate.getDate() === originDate.getDate()
  ) {
    return true;
  }
  return false;
}

export function identity<T>(x: T): T {
  return x;
}
