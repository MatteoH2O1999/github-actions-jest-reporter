import { mount } from '@vue/test-utils'
import NuxtLogo from '@/components/NuxtLogo.vue'

describe('NuxtLogo', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(NuxtLogo)
    expect(wrapper.vm).toBeTruthy()
  })
  
  test('is not a Vue instance', () => {
    const wrapper = mount(NuxtLogo)
  })

  describe('NuxtLogo2', () => {
    test('is a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
      expect(wrapper.vm).toBeTruthy()
    })
    
    test('is not a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
    })
  })
})
