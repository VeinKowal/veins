import Rain from './Rain';
import Snow from './Snow';
import Thunder from './Thunder';
import Wind from './Wind';
import * as THREE from 'three';

export type particleType = Rain | Snow | Thunder | Wind | THREE.FogExp2;

// 初始化雨水特效
const rain = () => new Rain();
const snow = () => new Snow();
const thunder = () => new Thunder();
const wind = () => new Wind();
// THREE.FogExp2的形参中 第一个参数为颜色 第二个参数为可见度/浓度，数值越高可见度越低
const fog = () => new THREE.FogExp2(0xcccccc, 0.00015);
const sand = () => new THREE.FogExp2(0xefd1b5, 0.00015);

export const particleConfig: Record<string, Function[]> = {
  晴: [],
  少云: [],
  晴间多云: [],
  多云: [],
  阴: [],
  有风: [wind],
  平静: [],
  微风: [wind],
  和风: [wind],
  清风: [wind],
  '强风/劲风': [wind],
  疾风: [wind],
  大风: [wind],
  烈风: [wind],
  风暴: [wind],
  狂爆风: [wind],
  飓风: [wind],
  热带风暴: [wind],
  // 霾: [fog],
  // 中度霾: [fog],
  // 重度霾: [fog],
  // 严重霾: [fog],
  阵雨: [rain],
  雷阵雨: [rain, thunder],
  雷阵雨并伴有冰雹: [rain, thunder],
  小雨: [rain],
  中雨: [rain],
  大雨: [rain],
  暴雨: [rain],
  大暴雨: [rain],
  特大暴雨: [rain],
  强阵雨: [rain],
  强雷阵雨: [rain, thunder],
  极端降雨: [rain],
  '毛毛雨/细雨': [rain],
  雨: [rain],
  '小雨-中雨': [rain],
  '中雨-大雨': [rain],
  '大雨-暴雨': [rain],
  '暴雨-大暴雨': [rain],
  '大暴雨-特大暴雨': [rain],
  雨雪天气: [rain, snow],
  雨夹雪: [rain, snow],
  阵雨夹雪: [rain, snow],
  冻雨: [rain],
  雪: [snow],
  阵雪: [snow],
  小雪: [snow],
  中雪: [snow],
  大雪: [snow],
  暴雪: [snow],
  '小雪-中雪': [snow],
  '中雪-大雪': [snow],
  '大雪-暴雪': [snow],
  浮尘: [],
  // 扬沙: [sand],
  // 沙尘暴: [sand],
  // 强沙尘暴: [sand],
  龙卷风: [wind],
  // 雾: [fog],
  // 浓雾: [fog],
  // 强浓雾: [fog],
  // 轻雾: [fog],
  // 大雾: [fog],
  // 特强浓雾: [fog],
  热: [],
  冷: [],
  未知: [],
};
