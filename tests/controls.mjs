// Exercise either a native select or the public Astryx combobox/listbox UI.
// Never set React internals or synthesize a successful selection in tests.
export async function choose(page,selector,value) {
  const field=page.locator(selector);
  if(await field.evaluate(e=>e.tagName)==='SELECT')return field.selectOption(value);
  await field.click();
  await page.locator('[role="option"]').filter({has:page.locator('[data-choice-value="'+value+'"]')}).click();
  await page.waitForFunction(selector=>document.querySelector(selector)?.getAttribute('aria-expanded')!=='true',selector);
}
export async function choiceValue(page,selector,name) {
  const field=page.locator(selector);
  if(await field.evaluate(e=>e.tagName)==='SELECT')return field.inputValue();
  return page.locator('input[type="hidden"][name="'+name+'"]').inputValue();
}
