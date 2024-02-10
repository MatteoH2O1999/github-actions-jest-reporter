import { mount } from '@vue/test-utils'
import NuxtLogo from '@/components/NuxtLogo.vue'

test('pass', () => {
  expect(true).toBeTruthy();
})

describe('NuxtLogo', () => {

  describe('NuxtLogo2', () => {
    test('is a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
      expect(wrapper.vm).toBeTruthy()
    })

    test('is not a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
    })
  })

  describe('NuxtLogo3', () => {
    test('is a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
      expect(wrapper.vm).toBeTruthy()
    })

    test('is not a Vue instance', () => {
      const wrapper = mount(NuxtLogo)
    })

    test.todo('TODO')
  })

  describe('NuxtLogo4', () => {

    describe('NuxtLogo5', () => {
      test('is a Vue instance', () => {
        const wrapper = mount(NuxtLogo)
        expect(wrapper.vm).toBeTruthy()
      })

      test.skip('is not a Vue instance', () => {
        const wrapper = mount(NuxtLogo)
      })
    })
  })
})
