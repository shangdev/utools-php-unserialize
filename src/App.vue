<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution"; // 代码高亮&提示
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution"; // 代码高亮&提示
import "monaco-editor/esm/vs/language/typescript/monaco.contribution"; // 代码高亮&提示
import "monaco-editor/esm/vs/editor/contrib/folding/browser/folding.js"; // 折叠
import "monaco-editor/esm/vs/editor/contrib/format/browser/formatActions.js"; // 格式化代码

self.MonacoEnvironment = {
  getWorker: function (_workerId, label) {
    switch (label) {
      case "typescript":
      case "javascript":
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};

const monacoRef = ref<HTMLElement | null>(null);
const language = ref("php");
const theme = ref("vs-light");
const parsedValue = ref<any>(null);
const shouldAutoUnserialize = ref(true);
const showToast = ref(false);
const toastMessage = ref("");

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

// 显示 Toast 的通用函数
function showToastMessage(message: string) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 1500);
}

// 处理反序列化
function handleUnserialize() {
  const value = editor?.getValue() || "";
  try {
    parsedValue.value = window.php.unserialize(value);
    if (parsedValue.value) {
      const jsonString = JSON.stringify(parsedValue.value, null, 2);
      editor?.setValue(jsonString);
    }
  } catch (error) {
    console.error("反序列化失败:", error);
  }
}

// 序列化
function handleSerialize() {
  const value = editor?.getValue() || "";
  try {
    shouldAutoUnserialize.value = false;
    const serialized = window.php.serialize(JSON.parse(value));
    editor?.setValue(serialized);
    setTimeout(() => {
      shouldAutoUnserialize.value = true;
    }, 100);
  } catch (error) {
    shouldAutoUnserialize.value = true;
    showToastMessage("序列化失败，请检查输入格式");
  }
}

// 复制结果
function copyResult() {
  const value = editor?.getValue() || "";
  window.utools.copyText(value);
  showToastMessage("复制成功");
}

// 添加清空函数
function clearEditor() {
  editor?.setValue("");
}

// 处理编辑器值变化
function handleEditorChange(value: string) {
  if (!shouldAutoUnserialize.value) return;

  // 检查是否是可能的PHP序列化字符串
  // PHP序列化字符串通常以 s:, i:, a:, O:, N;, b: 等开头
  const phpSerializedPattern = /^[siabONd]:[0-9]+:|^N;/;
  if (!phpSerializedPattern.test(value.trim())) {
    return;
  }

  try {
    parsedValue.value = window.php.unserialize(value);
    if (parsedValue.value) {
      const jsonString = JSON.stringify(parsedValue.value, null, 2);
      if (editor && editor.getValue() !== jsonString) {
        editor.setValue(jsonString);
      }
    }
  } catch (error) {
    // 可以选择不输出错误日志，因为输入过程中出现错误是正常的
  }
}

const init = () => {
  // 确保 monacoRef.value 不为空
  if (!monacoRef.value) return;

  editor = monaco.editor.create(monacoRef.value, {
    value: "",
    language: language.value,
    theme: theme.value,
    automaticLayout: true,
    lineHeight: 24,
    tabSize: 2,
    domReadOnly: true,
  });

  editor?.onDidChangeModelContent(() => {
    // 使用可选链操作符
    const value = editor?.getValue() || "";
    if (value) {
      handleEditorChange(value);
    }
  });
};

onMounted(() => {
  init();

  window.utools.onPluginEnter(({ code, type, payload }) => {
    if (code === "match-php-serialize" && type === "regex" && editor) {
      editor.setValue(payload as string);
      handleEditorChange(payload as string);
    }
  });
});

onBeforeUnmount(() => {
  editor?.dispose();
});
</script>

<template>
  <div class="container">
    <div class="editor" id="monaco" ref="monacoRef"></div>
    <div class="controls">
      <button @click="handleUnserialize" class="btn btn-blue">反序列化</button>
      <button @click="handleSerialize" class="btn btn-green">序列化</button>
      <button @click="copyResult" class="btn btn-purple">复制结果</button>
      <button @click="clearEditor" class="btn btn-red">清空</button>
    </div>

    <!-- Toast 提示 -->
    <div v-if="showToast" class="toast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor {
  flex: 1;
}

.controls {
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  border-top: 1px solid #e5e7eb;
  background-color: white;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-blue {
  background-color: #3b82f6;
}

.btn-blue:hover {
  background-color: #2563eb;
}

.btn-green {
  background-color: #22c55e;
}

.btn-green:hover {
  background-color: #16a34a;
}

.btn-purple {
  background-color: #a855f7;
}

.btn-purple:hover {
  background-color: #9333ea;
}

.btn-red {
  background-color: #ef4444;
}

.btn-red:hover {
  background-color: #dc2626;
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  animation: fadeInOut 1.5s ease-in-out;
  pointer-events: none;
  z-index: 1000;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  15% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  85% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}
</style>
