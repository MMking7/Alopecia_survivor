# OpenCure rStage1 Map + Balance Summary

## Scope
- Source room: `rooms/rStage1/rStage1.yy` + `rooms/rStage1/RoomCreationCode.gml`
- Balance data: `scripts/Characters/Characters.gml`, `scripts/Upgrades/Upgrades.gml`, `scripts/Items/Items.gml`, `scripts/Perks/Perks.gml`, `objects/oGame/Other_2.gml`
- Specials: `scripts/Specials/Specials.gml`

## Map / Room
- Room size: 3840 x 3840
- Background sprite: `Sprite200` (3840 x 3840)
- Background image file: `sprites/Sprite200/d65f9444-13e7-4615-9249-c14b676c9e93.png`
- Placed object types: `oCam`, `oCollision`, `oDeadTree`, `oDepthManager`, `oDepthParent`, `oPillar`, `oPillarBroken`, `oPillarYagoo`, `oTree`
- Room creation code: resets input state, resets timer in singleplayer, stops audio, plays `snd_suspect`

## Character Base Stats
| Character | HP | Speed | ATK | Crit | Ball Size | Default Weapon | Flat | Unlocked |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Amelia Watson | 75 | 1.35 | 1.30 | 1.10 | 3 | Weapons.AmePistol (Pistol Shot) | false | true |
| Gawr Gura | 65 | 1.40 | 1.10 | 1.05 | 1 | Weapons.GuraTrident (GuraTrident) | true | false |
| Ninomae Ina'nis | 75 | 1.50 | 0.90 | 1.01 | 1 | Weapons.InaTentacle (Summon Tentacle) | true | true |
| Pipkin Pippa | 60 | 1.50 | 0.95 | 1.10 | 1 | Weapons.PipiPilstol (PiPiPilstols) | true | true |

### Base Stat Modifiers
- `initializePlayer` adds HP bonus: `+ (4 * shopUpgrades.Hp.level)` (note: shop description says +4% per level, but code uses flat +4)
- `Hardcore` shop upgrade forces `MAXHP = 1`
- Base pickup radius starts at `35`

## Upgrades Overview
### Shop Upgrades (persistent)
| Upgrade | Effect | Max Lv |
| --- | --- | --- |
| Max HP Up | Increase Max HP by 4% per level. (Max 40%) | 10 |
| ATK Up | Increase all damage by 6% per level. (Max 60%) | 10 |
| SPD Up | Increase movement speed by 6% per level. (Max 60%) | 10 |
| Crit Up | Increase critical hit chance by 2% per level. (max 10%) | 5 |
| Pick Up Range | Increase base pick up range by 10% per level. (Max 100%) | 10 |
| Haste Up | Increase attack speed by 4% per level. (Max 20%) | 5 |
| Regeneration | Slowly heals 1 HP every 5 seconds. +1 HP per level. (Max 5 HP/ 5 seconds) | 5 |
| Special Attack | Unlocks the Special Attack for all characters. Press the secondary button (default: X) to use. | 1 |
| Special Cooldown Reduction | Reduces the cooldown time of special attack by 3% per level. (Max 15%) | 5 |
| Growth | Increase the damage of Character Main Weapons and Special Attacks by 2% per in-game level. | 1 |
| EXP Gain Up | Increases the amount of EXP gained by 4% per level. (max 20%) | 5 |
| Food Drops Up | Increases the rate that food is dropped by 4% per level. (max 20%) | 5 |
| Money Gain Up | Increases the amount of HoloCoins gained by 20% per level. (Max 200%) | 10 |
| Reroll | Grants a use of Reroll when leveling up. | 5 |
| Enhancement Rate Up | Increases the chance of success during enhancements by 3% per level. (Max 15%) | 5 |
| Defense Up | Increases defense, reducing damage taken by 3% per level. (Max 15%) | 5 |
| G Rank Off | Turn off bonuses gained from G Ranks on all characters. | 1 |
| Hardcore | Ultimate challenge! HP is set to 1. Gain massive bonus score the longer you survive in Endless Mode. | 1 |

### Weapon Upgrades
#### Character / Perk-Linked
| Weapon | Max Lv | Notes |
| --- | --- | --- |
| Weapons.AmePistol (Pistol Shot) | 7 | Characters.Amelia, perk=true |
| Weapons.PowerofAtlantis (Power of Atlantis) | 3 | Characters.Lenght, perk=true |
| Weapons.InaTentacle (Summon Tentacle) | 7 | Characters.Ina, perk=true |
| Weapons.Shockwave (Shockwave) | 1 | Characters.Lenght, perk=true |
| Weapons.PipiPilstol (PiPiPilstols) | 6 | Characters.Pippa, perk=true |
| Weapons.HeavyArtillery (Heavy Artillery) | 3 | Characters.Lenght, perk=true |
| Weapons.GuraTrident (GuraTrident) | 7 | Characters.Gura |

#### General Weapons
| Weapon | Max Lv |
| --- | --- |
| Weapons.BlBook (BL Book) | 7 |
| Weapons.BounceBall (Bounce Ball) | 7 |
| Weapons.CuttingBoard (Cutting Board) | 7 |
| Weapons.FanBeam (Fan Beam) | 7 |
| Weapons.CEOTears (CEO's Tears) | 7 |
| Weapons.EliteLavaBucket (Elite Lava Bucket) | 7 |
| Weapons.ENsCurse (EN's Curse) | 7 |
| Weapons.HoloBomb (Holo Bomb) | 7 |
| Weapons.PlugAsaCoco (Plug Type Asacoco) | 7 |
| Weapons.SpiderCooking (Spider Cooking) | 7 |
| Weapons.Glowstick (Glowstick) | 7 |
| Weapons.IdolSong (Idol Song) | 7 |
| Weapons.PsychoAxe (Psycho Axe) | 7 |
| Weapons.WamyWater (Wamy Water) | 7 |
| Weapons.XPotato (X-Potato) | 7 |

#### Collab Weapons
| Collab Result | Ingredients | Max Lv |
| --- | --- | --- |
| Weapons.MiComet | Weapons.EliteLavaBucket, Weapons.PsychoAxe | 1 |
| Weapons.EldritchHorror | Weapons.ENsCurse, Weapons.SpiderCooking | 1 |
| Weapons.AbsoluteWall | Weapons.CuttingBoard, Weapons.BounceBall | 1 |
| Weapons.BLFujoshi | Weapons.BlBook, Weapons.PsychoAxe | 1 |
| Weapons.BoneBros | Weapons.ENsCurse, Weapons.CuttingBoard | 1 |
| Weapons.BreatheInTypeAsacoco | Weapons.PlugAsaCoco, Weapons.HoloBomb | 1 |
| Weapons.EliteCooking | Weapons.EliteLavaBucket, Weapons.SpiderCooking | 1 |
| Weapons.RingOfFitness | Weapons.BounceBall, Weapons.CEOTears | 1 |
| Weapons.StreamOfTears | Weapons.FanBeam, Weapons.CEOTears | 1 |
| Weapons.ImDie | Weapons.XPotato, Weapons.HoloBomb | 1 |

#### Auxiliary / Internal Weapon Entries
- These appear in `Upgrades.gml` but look like sub-weapons or effect helpers: Weapons.BLFujoshiAxe, Weapons.BLFujoshiBook, Weapons.BoneBrosBullet, Weapons.BoneBrosSlash, Weapons.ImDieExplosion, Weapons.MiCometMeteor, Weapons.MiCometPool, Weapons.XPotatoExplosion

### Items (passives)
| Item | Max Lv | BonusType |
| --- | --- | --- |
| Blacksmith's Gear | 3 |  |
| Body Pillow | 5 | BonusType.Defense |
| Breastplate | 3 | [BonusType.Defense, BonusType.Speed] |
| Devil Hat | 3 |  |
| Holocoin | 1 |  |
| Hamburguer | 1 |  |
| Chicken's Feather | 3 |  |
| Credit Card | 5 | [BonusType.AnvilDrop, BonusType.EnhancingCost] |
| GWS Pill | 3 |  |
| Just Bandage | 3 |  |
| Limiter | 3 | BonusType.PickupRange |
| Super Chatto Time | 5 | BonusType.SuperChattoTime |
| Stolen Piggy Bank | 1 |  |
| Sake | 3 |  |
| Plushie | 3 |  |
| Piki Piki Piman | 3 |  |
| Membership | 3 |  |
| Halu | 5 |  |
| Hope Soda | 5 | BonusType.CriticalDamage |
| Idol Costume | 5 |  |
| Energy Drink | 3 | [BonusType.Haste, BonusType.Speed] |
| Face Mask | 1 | [BonusType.Damage, BonusType.Haste, BonusType.TakeDamage] |
| Full Meal | 1 |  |
| Gorilla's Paw | 3 | [BonusType.Damage, BonusType.Critical] |
| Headphones | 5 |  |
| Injection Type Asacoco | 3 | BonusType.Damage |
| Knightly Milk | 3 | [BonusType.WeaponSize, BonusType.PickupRange] |
| Nurse's Horn | 3 |  |
| Study Glasses | 5 | BonusType.XPBonus |
| Uber Sheep | 5 | BonusType.UberSheep |

### Perks (character-specific)
| Perk | Max Lv | Character |
| --- | --- | --- |
| FPS Mastery | 3 | Characters.Amelia |
| Detective Eye | 3 | Characters.Amelia |
| Bubba | 3 | Characters.Amelia |
| Short Size | 3 | Characters.Gura |
| Power of Atlantis | 3 | Characters.Gura |
| Shark Bite | 3 | Characters.Gura |
| Heavy Artillery | 3 | Characters.Pippa |
| Moldy Soul | 3 | Characters.Pippa |
| Soda Fueled | 3 | Characters.Pippa |

### Special Attacks
| Special | Cooldown | Character | Effect |
| --- | --- | --- | --- |
| Slow Time | 60 | Characters.Amelia | Slows all target movement by 80% while Pistol Shot shoots 50% faster for 15 seconds. |
| Shark Call | 45 | Characters.Gura | Summon a shark that deals 500% damage to all targets around. Gura turns red, increasing ATK by 50% and SPD by 25% for 15 seconds. |
| Tako Spin | 60 | Characters.Ina | Summons 8 tentacles around Ina, then spins rapidly around her, dealing 150% damage and knockback to all targets. |
| Walmart Form | 60 | Characters.Pippa | Summons 8 tentacles around Ina, then spins rapidly around her, dealing 150% damage and knockback to all targets. |

## Notes For React Port
- Consider exporting the tables above into JSON so gameplay tuning is data-driven.
- Room is large (3840x3840); a camera/viewport system is assumed (see `oCam` usage in room instances).
- Upgrade selection logic pulls from separate weapon/item/perk pools (see `randomUpgrades()` in `scripts/Upgrades/Upgrades.gml`).
