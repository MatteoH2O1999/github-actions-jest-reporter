import { mount } from '@vue/test-utils'
import NuxtLogo from '@/components/NuxtLogo.vue'

test('fail', () => {
  throw "fail";
})

describe('NuxtLogo', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(NuxtLogo)
    expect(wrapper.vm).toBeTruthy()
  })

  test('is not a Vue instance', () => {
    const wrapper = mount(NuxtLogo)
    expect(false).toBeFalsy()
  })

  describe('NuxtLogo2', () => {
    test('is a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
      expect(wrapper.vm).toBeTruthy()
    })

    test('is not a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
      expect(false).toBeFalsy()
    })
  })
})
