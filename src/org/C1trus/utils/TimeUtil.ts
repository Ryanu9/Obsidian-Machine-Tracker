import NumberUtil from "./NumberUtil";
import {i18nHelper} from "../lang/helper";

export default class TimeUtil {
	/**
	 * Format date
	 * e.g.: formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss') => 2021-01-01 12:00:00
	 * @param date
	 * @param format
	 */
	public static formatDate(date:Date, format: string = 'yyyy-MM-dd HH:mm:ss'):string {
		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hour = date.getHours()
		const minute = date.getMinutes()
		const second = date.getSeconds()
		const formatMap: { [key: string]: any } = {
			yyyy: year.toString(),
			MM: month.toString().padStart(2, '0'),
			dd: day.toString().padStart(2, '0'),
			HH: hour.toString().padStart(2, '0'),
			mm: minute.toString().padStart(2, '0'),
			ss: second.toString().padStart(2, '0')
		}
		return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (match) => formatMap[match])
	}

	public static getLastMonth() {
		const date = new Date();
		date.setMonth(date.getMonth() - 1);
		return date;
	}
}

export const sleep = (ms:number)=> {
	return new Promise(resolve=>setTimeout(resolve, ms))
}

export const sleepRange = (msMin: number, msMax:number)=> {
	const msTime = NumberUtil.getRandomNum(msMin, msMax);
	return new Promise(resolve=>setTimeout(resolve, msTime))
}