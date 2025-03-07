# picatch commit 컨벤션

| 태그 이름            | 설명                                                               |
| -------------------- | ------------------------------------------------------------------ |
| **Feat**             | 새로운 기능을 추가할 경우                                          |
| **Fix**              | 버그를 고친 경우                                                   |
| **Design**           | CSS 등 사용자 UI 디자인 변경                                       |
| **!BREAKING CHANGE** | 커다란 API 변경의 경우                                             |
| **!HOTFIX**          | 급하게 치명적인 버그를 고쳐야 하는 경우                            |
| **Style**            | 코드 포맷 변경, 세미콜론 누락 등 (코드 수정 없음)                  |
| **Refactor**         | 프로덕션 코드 리팩토링                                             |
| **Comment**          | 필요한 주석 추가 및 변경                                           |
| **Docs**             | 문서를 수정한 경우                                                 |
| **Test**             | 테스트 추가, 테스트 리팩토링 (프로덕션 코드 변경 없음)             |
| **Chore**            | 빌드 태스크 업데이트, 패키지 매니저 설정 (프로덕션 코드 변경 없음) |
| **Rename**           | 파일 혹은 폴더명을 수정하거나 옮기는 작업만인 경우                 |
| **Remove**           | 파일을 삭제하는 작업만 수행한 경우                                 |

📂 picketch-backend
├── 📂 config
│ └── config.js
├── 📂 controllers
│ └── anyController.js
├── 📂 docs
│ └── 📂 component
│ │ └── index.yaml
│ └── 📂 paths
│ │ └── any.yaml
│ └── swagger.yaml
├── 📂 middlewares
│ └── anyMiddleware.js
├── 📂 models
│ └── Any.js
│ └── index.js
├── 📂 routes
│ └── any.js
│ └── index.js
├── 📂 socket
│ └── Any.js
│ └── index.js
├── 📂 utils
│ └── common.js
├── .env
├── .gitingore
├── .prettierrc.json
├── app.js
├── catch.vuerd.json
├── init.sql
├── package-lock.json
├── package.json
└── README.md
