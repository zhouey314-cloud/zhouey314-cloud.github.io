/* A local brief composer. No network requests, persistence or automatic sending. */
(() => {
  'use strict';
  const form = document.querySelector('[data-inquiry-form]');
  if (!form) return;
  const output = document.querySelector('[data-inquiry-output]');
  const draft = document.getElementById('inquiry-draft');
  const feedback = document.querySelector('[data-brief-feedback]');
  const mail = document.querySelector('[data-email-brief]');
  const topic = form.elements.namedItem('topic');
  const topics = new Set([...topic.options].map(option => option.value));
  const initial = new URLSearchParams(location.search).get('topic');
  topic.value = topics.has(initial) ? initial : 'other';
  const email = document.querySelector('.collaborate-email').textContent.trim();
  let subject = '';
  let hasGenerated = false;
  const problem = form.elements.namedItem('problem');
  const validProblem = () => {
    const valid = Boolean(problem.value.trim());
    problem.setCustomValidity(valid ? '' : '请先描述一个具体问题或岗位需求。');
    return valid;
  };
  function clearOutput() {
    output.hidden = true;
    draft.value = '';
    mail.href = `mailto:${email}`;
    feedback.textContent = '';
  }
  function compose() {
    const values = new FormData(form);
    const intent = {project:'项目合作',role:'岗位交流',exchange:'技术交流'}[values.get('intent')] || '项目合作';
    const direction = topic.selectedOptions[0].textContent.trim();
    subject = `${intent} · ${direction} · 与恩宇交流`;
    draft.value = [
      '你好，恩宇：', '', `想与你交流：${intent}`, `方向：${direction}`, '',
      '【问题 / 岗位需求】', values.get('problem').trim(), '',
      '【已有资料 / 系统 / 团队条件】', values.get('context').trim() || '沟通时补充', '',
      '【期望产物与完成标准】', values.get('result').trim() || '一起确认', '',
      '【时间安排 / 合作条件】', values.get('timing').trim() || '沟通时确认', '',
      '通过 https://zhouey314-cloud.github.io/collaborate.html 整理'
    ].join('\n');
    const fullMail = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft.value)}`;
    const tooLong = fullMail.length > 1800;
    document.querySelector('[data-email-note]').hidden = !tooLong;
    mail.href = tooLong ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('你好，恩宇：\n\n我已整理沟通提纲，将在这里粘贴全文。')}` : fullMail;
    feedback.textContent = '';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validProblem()) clearOutput();
    if (!form.reportValidity()) return;
    compose(); hasGenerated = true; output.hidden = false;
    document.getElementById('inquiry-output-title').focus({preventScroll:true});
    output.scrollIntoView({block:'start', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
  form.addEventListener('input', () => {
    const valid = validProblem();
    if (!hasGenerated) return;
    if (!valid) { clearOutput(); return; }
    compose(); output.hidden = false;
  });
  document.querySelector('[data-copy-brief]').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw Error('clipboard unavailable');
      await navigator.clipboard.writeText(draft.value);
      feedback.textContent = '提纲已复制，可以粘贴到微信或邮件中。';
    } catch {
      draft.focus(); draft.select();
      feedback.textContent = '复制未获允许，已选中提纲。请使用系统的复制操作。';
    }
  });
  document.querySelector('[data-download-brief]').addEventListener('click', () => {
    const blob = new Blob([subject + '\n\n' + draft.value + '\n'], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');link.href = url;link.download = '与恩宇沟通的提纲.txt';
    document.body.append(link);link.click();link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback.textContent = '提纲已准备为文本文件。';
  });
  form.hidden = false;
  document.querySelector('[data-inquiry-fallback]').hidden = true;
})();
