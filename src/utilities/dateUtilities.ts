export const addDays = (date: Date, days: number): Date => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const getDiff = (d1: Date, d2: Date): number => {
    var result = d1.getTime() - d2.getTime();
    return result;
};

export const daysMatch = (d1: Date, d2: Date): boolean => {
    return d1.getDate() == d2.getDate() &&
        d1.getMonth() == d2.getMonth() &&
        d1.getFullYear() == d2.getFullYear()
}

export const twoDigitPad = (num: number): string => {
    return num < 10 ? ("0" + String(num)) : String(num);
}

export const formatDate = (date: Date, patternStr: string): string => {
    var monthNames = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
    ];
    var dayOfWeekNames = [
        "Sunday", "Monday", "Tuesday",
        "Wednesday", "Thursday", "Friday", "Saturday"
    ];
    if (!patternStr) {
        patternStr = 'M/d/yyyy';
    }
    var day = date.getDate(),
        month = date.getMonth(),
        year = date.getFullYear(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds(),
        miliseconds = date.getMilliseconds(),
        h = hour % 12,
        hh = twoDigitPad(h),
        HH = twoDigitPad(hour),
        mm = twoDigitPad(minute),
        ss = twoDigitPad(second),
        aaa = hour < 12 ? 'AM' : 'PM',
        EEEE = dayOfWeekNames[date.getDay()],
        EEE = EEEE.substring(0, 3),
        dd = twoDigitPad(day),
        M = month + 1,
        MM = twoDigitPad(M),
        MMMM = monthNames[month],
        MMM = MMMM.substring(0, 3),
        yyyy = year + "",
        yy = yyyy.substring(2, 2);
    // checks to see if month name will be used
    if (patternStr.indexOf('MMM') <= -1) {
        patternStr = patternStr
            .replace('MM', MM)
            .replace('M', String(M));
    }

    patternStr = patternStr
        .replace('hh', hh).replace('h', String(h))
        .replace('HH', HH).replace('H', String(hour))
        .replace('mm', mm).replace('m', String(minute))
        .replace('ss', ss).replace('s', String(second))
        .replace('S', String(miliseconds))
        .replace('dd', dd).replace('d', String(day))

        .replace('EEEE', EEEE).replace('EEE', EEE)
        .replace('yyyy', yyyy)
        .replace('yy', yy)
        .replace('aaa', aaa);
    
    if (patternStr.indexOf('MMM') > -1) {
        patternStr = patternStr
            .replace('MMMM', MMMM)
            .replace('MMM', MMM);
    }
    
    return patternStr;
}

export const enumerateDaysBetweenDates = (
    startDate: Date,
    endDate: Date
): Date[] => {
    var dates: Date[] = [];

    var currDate: Date;
    let lastDate: Date;

    currDate = startDate;
    lastDate = endDate;

    currDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    dates.push(currDate);

    var diff = getDiff(currDate, lastDate);

    var testDate = currDate;
    if (diff < 0) {
        while (getDiff(testDate, lastDate) < 0) {
            testDate = addDays(testDate, 1);
            dates.push(testDate);
        }
    }

    //dates.push(lastDate);

    return dates;
};

export const enumerateStringDaysBetweenDates = (
    startDate: Date,
    endDate: Date
): string[] => {
    var dates: string[] = [];

    var currDate: Date;
    let lastDate: Date;

    currDate = startDate;
    lastDate = endDate;

    currDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    dates.push(formatDate(currDate, 'dd-MMM-yyyy'));

    var diff = getDiff(currDate, lastDate);

    var testDate = currDate;
    if (diff < 0) {
        while (getDiff(testDate, lastDate) < 0) {
            testDate = addDays(testDate, 1);
            dates.push(formatDate(testDate, 'dd-MMM-yyyy'));
        }
    }

    dates.push(formatDate(lastDate, 'dd-MMM-yyyy'));

    return dates;
};

export const checkIfWeekendDay = (date: Date): boolean => {
    var isWeekend = false;
    var dayOfWeek = date.getDay();
    isWeekend = (dayOfWeek === 6) || (dayOfWeek  === 0);
    return isWeekend;
};
/*
var monthNames = [
  "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"
];
var dayOfWeekNames = [
  "Sunday", "Monday", "Tuesday",
  "Wednesday", "Thursday", "Friday", "Saturday"
];
function formatDate(date, patternStr){
    if (!patternStr) {
        patternStr = 'M/d/yyyy';
    }
    var day = date.getDate(),
        month = date.getMonth(),
        year = date.getFullYear(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds(),
        miliseconds = date.getMilliseconds(),
        h = hour % 12,
        hh = twoDigitPad(h),
        HH = twoDigitPad(hour),
        mm = twoDigitPad(minute),
        ss = twoDigitPad(second),
        aaa = hour < 12 ? 'AM' : 'PM',
        EEEE = dayOfWeekNames[date.getDay()],
        EEE = EEEE.substr(0, 3),
        dd = twoDigitPad(day),
        M = month + 1,
        MM = twoDigitPad(M),
        MMMM = monthNames[month],
        MMM = MMMM.substr(0, 3),
        yyyy = year + "",
        yy = yyyy.substr(2, 2)
    ;
    // checks to see if month name will be used
    patternStr = patternStr
      .replace('hh', hh).replace('h', h)
      .replace('HH', HH).replace('H', hour)
      .replace('mm', mm).replace('m', minute)
      .replace('ss', ss).replace('s', second)
      .replace('S', miliseconds)
      .replace('dd', dd).replace('d', day)
      
      .replace('EEEE', EEEE).replace('EEE', EEE)
      .replace('yyyy', yyyy)
      .replace('yy', yy)
      .replace('aaa', aaa);
    if (patternStr.indexOf('MMM') > -1) {
        patternStr = patternStr
          .replace('MMMM', MMMM)
          .replace('MMM', MMM);
    }
    else {
        patternStr = patternStr
          .replace('MM', MM)
          .replace('M', M);
    }
    return patternStr;
}
function twoDigitPad(num) {
    return num < 10 ? "0" + num : num;
}
console.log(formatDate(new Date()));
console.log(formatDate(new Date(), 'dd-MMM-yyyy')); //OP's request
console.log(formatDate(new Date(), 'EEEE, MMMM d, yyyy HH:mm:ss.S aaa'));
console.log(formatDate(new Date(), 'EEE, MMM d, yyyy HH:mm'));
console.log(formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss.S'));
console.log(formatDate(new Date(), 'M/dd/yyyy h:mmaaa'));

yy = 2-digit year; yyyy = full year

M = digit month; MM = 2-digit month; MMM = short month name; MMMM = full month name

EEEE = full weekday name; EEE = short weekday name

d = digit day; dd = 2-digit day

h = hours am/pm; hh = 2-digit hours am/pm; H = hours; HH = 2-digit hours

m = minutes; mm = 2-digit minutes; aaa = AM/PM

s = seconds; ss = 2-digit seconds

S = miliseconds
*/