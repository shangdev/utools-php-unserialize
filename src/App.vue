<script setup lang="ts">
import { ref, onMounted } from "vue";

const parsedValue = ref<any>(null);
const errorMessage = ref("");
const editableContent = ref("");

// 处理输入的PHP序列化字符串
function handleInput(input: string) {
  try {
    parsedValue.value = window.php.unserialize(input);
    errorMessage.value = "";
    editableContent.value = JSON.stringify(parsedValue.value, null, 2);
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = "未知错误";
    }
    parsedValue.value = null;
    editableContent.value = input;
  }
}

// 监听uTools传递的参数
onMounted(() => {
  window.utools.onPluginEnter(({ code, type, payload }) => {
    if (code === "match-php-serialize" && type === "regex") {
      handleInput(payload as string);
    }
  });
});

// 处理编辑后的内容
function handleEdit(event: Event) {
  const target = event.target as HTMLPreElement;
  const content = target.innerText.trim();
  if (content.match(/^(a|O|s|i|d|b|N):\d+:/)) {
    handleInput(content);
  }
}

// 处理粘贴事件
function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const pastedText = event.clipboardData?.getData("text") || "";
  handleInput(pastedText);
}
</script>

<template>
  <div class="container">
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    <pre contenteditable="true" @input="handleEdit" @paste="handlePaste" class="editable-content">{{ editableContent }}</pre>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.error-message {
  color: red;
  padding: 16px;
}

.editable-content {
  flex: 1;
  background-color: #e0e0e0;
  padding: 16px;
  overflow: auto;
}
</style>
