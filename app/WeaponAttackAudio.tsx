"use client";

import { useEffect } from "react";
import { installWeaponAttackAudio } from "./weapon-audio";

export default function WeaponAttackAudio() {
  useEffect(() => installWeaponAttackAudio(), []);
  return null;
}
