# 🎮 머리카락 서바이버 (Alopecia Survivor)

> **"내 머리를 노리는 악당들이 나타났다!"** - 픽셀 아트 스타일의 머리카락 디펜스 로그라이크 액션 게임

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
---
링크 : https://alopecia-survivor.vercel.app/
팀원 : SKKU 이준한, SNU 김민기
## 📝 목차

1. [프로젝트 소개](#-프로젝트-소개)
   - [게임 설명](#-게임-설명)
   - [주요 기능](#-주요-기능)
2. [게임 시스템](#-게임-시스템)
3. [기술 스택](#%EF%B8%8F-기술-스택)
4. [Getting Started](#-getting-started)
5. [프로젝트 구조](#-프로젝트-구조)

---

## 📖 프로젝트 소개

> **끝없이 밀려오는 적들을 물리치고 살아남으세요!**

**Pixel Roguelike Survivor**는 픽셀 아트 스타일의 탑뷰 액션 로그라이크 게임입니다. 플레이어는 계속해서 생성되는 머리카락을 가져가는 적들을 처치하며 경험치를 얻고, 레벨업을 통해 다양한 스킬과 무기를 강화하여 최대한 오래 생존하는 것이 목표입니다.

### 🎯 게임 설명


https://github.com/user-attachments/assets/c218bc67-35f4-41ab-8a06-c7b21b6afecf


몰려오는 적들을 피하며 공격하고, 레벨업 시 제공되는 업그레이드를 선택하여 자신만의 빌드를 만들어보세요. 특정 시간마다 등장하는 강력한 보스를 물리치면 막대한 보상을 획득할 수 있습니다.

### ✨ 주요 기능

| 기능 | 설명 |
|------|------|
|**다양한 캐릭터** | 각기 다른 능력치와 특성을 가진 여러 캐릭터 중 선택하여 플레이할 수 있습니다. |
|**로그라이크 성장** | 레벨업 시 랜덤하게 제시되는 업그레이드(무기, 스킬, 패시브) 중 선택하여 캐릭터를 강화합니다. |
|**보스 전투 시스템** | 일정 시간마다 등장하는 보스와의 전투! 보스 등장 시 전용 사운드와 자막 연출이 제공됩니다. |
|**스킬 & 무기 시스템** | 메인 무기(Main Weapon), 서브 무기(Sub Weapon), 패시브 스킬을 조합하여 전략적인 플레이가 가능합니다. |
|**맵 시스템** | 절차적으로 생성되는 장애물과 충돌 감지 시스템으로 역동적인 전투 환경을 제공합니다. |
|**상점 시스템** | 게임에서 획득한 코인으로 영구 스탯 업그레이드를 구매하여 다음 플레이를 더 쉽게 만들 수 있습니다. |
|**사운드 시스템** | BGM과 효과음(SFX) 볼륨을 개별 조절 가능하며, localStorage에 설정이 저장됩니다. |



---
---

## 🎮 게임 시스템

### 전투 시스템
```
플레이어 ──┬─> 메인 무기 (Main Weapon)
          │   • 스핀 어택, 빔 공격, 부메랑 등
          │   • 레벨업을 통한 강화
          │
          ├─> 서브 무기 (Sub Weapon)
          │   • 자동 공격 투사체
          │   • 등급(1★~3★) 시스템
          │   • 다중 획득 및 레벨업 가능
          │
          ├─> 패시브 스킬 (Passive)
          │   • 이동속도 증가, 체력 재생 등
          │   • 캐릭터별 고유 스킬
          │
          └─> 아이템 (Items)
              • 영구 스탯 증가
              • 즉시 효과 (체력 회복 등)
```

### 적 & 보스 시스템
- **일반 적**: 지속적으로 스폰되며 경험치와 코인을 드랍
- **보스**: 특정 시간(2분, 5분, 10분)에 등장
  - 보스 등장 시 전용 사운드와 자막 연출
  - 높은 체력과 공격력
  - 대량의 경험치와 코인 보상

### 맵 & 장애물 시스템
- 동적 장애물 생성 시스템
- 플레이어 이동에 따른 실시간 충돌 감지
- 나무, 덤불, 석상 등 다양한 장애물

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Language** | JavaScript (ES6+) |
| **Framework** | React 19 + Vite 7 |
| **Rendering** | Canvas 2D API |
| **State Management** | React Hooks (useState, useRef, useEffect) |
| **Audio** | HTMLAudioElement |
| **Storage** | localStorage (settings, shop progress) |
| **Styling** | CSS3 + Pixel Art Fonts |

---

## 🚀 실행 방법

### 1. 프로젝트 클론

```bash
git clone <repository-url>
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

게임이 `http://localhost:5173`에서 실행됩니다.

---

## 🎯 주요 컴포넌트

### 게임 엔진
- **useGameEngine.js**: 게임 상태 관리 및 업데이트 로직
- **useGameLoop.js**: 60 FPS 게임 루프
- **createInitialState.js**: 초기 게임 상태 생성

### 스킬 시스템
- **updateSkillSystems.js**: 스킬 업데이트 총괄
- **activateSpecialAbility.js**: 특수 능력 활성화
- **performMainAttack.js**: 메인 공격 처리
- **triggerSubWeaponAttacks.js**: 서브 무기 자동 공격

### 맵 시스템
- **mapRenderer.js**: 맵 렌더링 (타일, 장애물)
- **useCollision.js**: 충돌 감지
- **mapIntegration.js**: 맵 통합 및 초기화

---

## 🎨 게임 특징

### 픽셀 아트 스타일
- 레트로 픽셀 폰트 (NeoDunggeunmo, 궁서체)
- 커스텀 픽셀 커서
- 스캔라인 효과 및 레트로 UI

### 사운드 시스템
- BGM 자동 재생 및 무한 루프
- 개별 볼륨 조절 (BGM/SFX)
- 보스 전용 사운드 효과
- localStorage 설정 저장

### 상점 시스템
- 영구 업그레이드 (HP, ATK, SPD, CRIT, XP)
- 캐릭터 랭크 시스템
- 가챠 시스템

---

## 🎮 조작법

- **W, A, S, D** 또는 **방향키**: 이동
- **left Click**: 수동 조준 모드
- - **Shift**: 고유 스킬
- **P** 또는 **ESC**: 일시정지
- **\`** (백틱): 디버그 메뉴 (개발자 모드)

---

<p align="center">
  <b>Pixel Roguelike Survivor - Made with ❤️</b>
</p>
